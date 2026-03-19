import { auth } from "@/auth";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getRequiredConfig() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim() ?? "";
  const appUrl = process.env.NEXTAUTH_URL?.trim() ?? "";

  if (!priceId) {
    return {
      error:
        "Stripe is not configured for upgrades. Set STRIPE_PRO_PRICE_ID to a recurring Price ID from Stripe.",
    };
  }

  if (!appUrl) {
    return {
      error:
        "Stripe is not configured for upgrades. Set NEXTAUTH_URL before creating Checkout sessions.",
    };
  }

  return { priceId, appUrl };
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = getRequiredConfig();
  if ("error" in config) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  await connectDB();
  const user = await User.findOne({ userId: session.user.id });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email as string,
      name: (user.name as string) || (user.username as string),
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await User.updateOne({ userId: session.user.id }, { stripeCustomerId: customerId });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: config.priceId, quantity: 1 }],
    success_url: `${config.appUrl}/?upgraded=true`,
    cancel_url: `${config.appUrl}/upgrade?canceled=true`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
