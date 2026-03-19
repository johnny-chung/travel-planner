import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TripServiceError, approveTripRequestForOwner } from "@/features/trips/service";

type Params = { params: Promise<{ tripId: string }> };

function getStatusCode(error: TripServiceError) {
  switch (error.code) {
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "LIMIT_REACHED":
      return 403;
    default:
      return 500;
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  const { userId } = await request.json();

  try {
    await approveTripRequestForOwner(tripId, session.user.id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TripServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: getStatusCode(error) },
      );
    }

    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 });
  }
}
