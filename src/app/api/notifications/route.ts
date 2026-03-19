import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTripNotificationsForOwner } from "@/features/trips/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getTripNotificationsForOwner(session.user.id);
  return NextResponse.json(notifications);
}
