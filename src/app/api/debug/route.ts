import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Plan } from "@/lib/models/Plan";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No session" }, { status: 401 });

  await connectDB();

  const dbUser = await User.findOne({ userId: session.user.id }).lean();
  const allUsers = await User.find({}).lean();
  const allPlans = await Plan.find({}).lean();

  return NextResponse.json({
    session_user_id: session.user.id,
    session_user_email: session.user.email,
    db_user_found: !!dbUser,
    db_user: dbUser,
    all_users_count: allUsers.length,
    all_users: allUsers.map((u: Record<string, unknown>) => ({ userId: u.userId, auth0Sub: u.auth0Sub, email: u.email })),
    all_plans_count: allPlans.length,
    all_plans: allPlans.map((p: Record<string, unknown>) => ({ _id: String(p._id), userId: p.userId, name: p.name })),
  });
}
