import { auth } from "@/auth";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/upgrade?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/upgrade?canceled=true`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
