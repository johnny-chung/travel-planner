import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TripServiceError, createTripForUser, getTripSummariesForUser } from "@/features/trips/service";

function getStatusCode(error: TripServiceError) {
  switch (error.code) {
    case "FORBIDDEN":
      return 403;
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await getTripSummariesForUser(session.user.id);
  return NextResponse.json(trips);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  try {
    const trip = await createTripForUser(session.user.id, {
      name: payload.name ?? "",
      description: payload.description ?? "",
      location: payload.location ?? "",
      locationLat: payload.locationLat ?? null,
      locationLng: payload.locationLng ?? null,
      transportMode: payload.transportMode ?? "transit",
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof TripServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: getStatusCode(error) },
      );
    }

    return NextResponse.json(
      { error: "Failed to create trip", detail: String(error) },
      { status: 500 },
    );
  }
}
