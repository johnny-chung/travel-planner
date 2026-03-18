import { auth } from "@/auth";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  const cents = Math.round(Number(amount) * 100);
  if (!cents || cents < 100) return NextResponse.json({ error: "Minimum donation is $1.00" }, { status: 400 });

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
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: cents,
        product_data: {
          name: "Roamer's Ledger Donation",
          description: "Thank you for supporting Roamer's Ledger! ❤️",
        },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXTAUTH_URL}/donate?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/donate?canceled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
