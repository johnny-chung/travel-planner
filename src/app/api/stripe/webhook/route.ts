import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function findUserIdByCustomerId(customerId: string | null | undefined) {
  if (!customerId) return null;

  const user = (await User.findOne({ stripeCustomerId: customerId })
    .select("userId")
    .lean()) as { userId?: string } | null;

  return user?.userId ?? null;
}

async function getUserIdFromSubscription(subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata?.userId;
  if (metadataUserId) {
    return metadataUserId;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  return findUserIdByCustomerId(customerId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe-webhook] received", {
    id: event.id,
    type: event.type,
    objectType: event.data.object.object,
    customer:
      "customer" in event.data.object
        ? typeof event.data.object.customer === "string"
          ? event.data.object.customer
          : event.data.object.customer?.id ?? null
        : null,
    subscription:
      "subscription" in event.data.object
        ? typeof event.data.object.subscription === "string"
          ? event.data.object.subscription
          : event.data.object.subscription?.id ?? null
        : null,
  });

  await connectDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode !== "subscription") {
        break;
      }

      const customerId =
        typeof checkoutSession.customer === "string"
          ? checkoutSession.customer
          : checkoutSession.customer?.id;
      const userId = await findUserIdByCustomerId(customerId);
      if (!userId) {
        break;
      }

      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id ?? null;

      await User.updateOne(
        { userId },
        {
          membershipStatus: "pro",
          stripeSubscriptionId: subscriptionId,
        },
      );
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getUserIdFromSubscription(subscription);
      if (!userId) break;
      const isPro = subscription.status === "active" || subscription.status === "trialing";
      await User.updateOne(
        { userId },
        {
          membershipStatus: isPro ? "pro" : "basic",
          stripeSubscriptionId: subscription.id,
        }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getUserIdFromSubscription(subscription);
      if (!userId) break;
      await User.updateOne({ userId }, { membershipStatus: "basic", stripeSubscriptionId: null });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      const userId =
        (invoice.parent?.subscription_details?.metadata?.userId as string | undefined) ??
        (await findUserIdByCustomerId(customerId));
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : null;

      if (userId) {
        await User.updateOne(
          { userId },
          {
            membershipStatus: "pro",
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
          },
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      // In Stripe SDK v20+, Invoice uses parent.subscription_details instead of a top-level subscription field
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      // metadata on subscription_details contains the subscription metadata snapshot
      const userId = subDetails?.metadata?.userId as string | undefined;
      if (userId) {
        await User.updateOne({ userId }, { membershipStatus: "basic" });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
