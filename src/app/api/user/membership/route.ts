import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNavigationSummary } from "@/features/navigation/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { membershipStatus } = await getNavigationSummary(session.user.id);
  return NextResponse.json({ membershipStatus });
}
