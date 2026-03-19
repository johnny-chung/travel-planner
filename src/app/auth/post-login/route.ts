import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGuestId } from "@/features/guest/session";
import { claimGuestTripsForUser } from "@/features/trips/service";

const GUEST_COOKIE = "rl_guest_id";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const guestId = await getGuestId();
  let destination = "/trips";

  if (guestId) {
    const claimedTripId = await claimGuestTripsForUser(guestId, session.user.id);
    if (claimedTripId) {
      destination = `/trips/${claimedTripId}`;
    }
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  if (guestId) {
    response.cookies.delete(GUEST_COOKIE);
  }

  return response;
}
