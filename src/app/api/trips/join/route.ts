import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TripServiceError, joinTripForUser } from "@/features/trips/service";

function getStatusCode(error: TripServiceError) {
  switch (error.code) {
    case "NOT_FOUND":
      return 404;
    case "LIMIT_REACHED":
      return 403;
    case "VALIDATION_ERROR":
    case "INVALID_STATE":
      return 400;
    default:
      return 500;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  try {
    const planName = await joinTripForUser(session.user.id, payload.shareCode ?? "", {
      name: session.user.name,
      email: session.user.email,
    });

    return NextResponse.json({ success: true, planName });
  } catch (error) {
    if (error instanceof TripServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: getStatusCode(error) },
      );
    }

    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 });
  }
}
