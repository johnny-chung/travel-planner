import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TripServiceError, deleteTripForUser, updateTripStatusForUser } from "@/features/trips/service";

type Params = { params: Promise<{ tripId: string }> };

function getStatusCode(error: TripServiceError) {
  switch (error.code) {
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
    case "INVALID_STATE":
      return 400;
    default:
      return 500;
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  const body = await request.json();

  try {
    const updated = await updateTripStatusForUser(
      tripId,
      session.user.id,
      body.status === "active" ? "active" : "archived",
    );

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof TripServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: getStatusCode(error) },
      );
    }

    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  await deleteTripForUser(tripId, session.user.id);
  return NextResponse.json({ success: true });
}
