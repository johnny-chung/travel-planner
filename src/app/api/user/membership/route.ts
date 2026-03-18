import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findOne({ userId: session.user.id }).select("membershipStatus").lean();
  const membershipStatus = (user as { membershipStatus?: string } | null)?.membershipStatus ?? "basic";
  return NextResponse.json({ membershipStatus });
}
