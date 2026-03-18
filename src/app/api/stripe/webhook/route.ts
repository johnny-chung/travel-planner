import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
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
      const userId = subscription.metadata?.userId;
      if (!userId) break;
      await User.updateOne({ userId }, { membershipStatus: "basic", stripeSubscriptionId: null });
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
