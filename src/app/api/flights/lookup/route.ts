import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  TripServiceError,
} from "@/features/trips/errors";
import {
  isValidFlightNumber,
  lookupFlightRouteSuggestions,
} from "@/features/trip-logistics/service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flightNumber = req.nextUrl.searchParams.get("flightNumber")?.trim() ?? "";
  if (!flightNumber) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!isValidFlightNumber(flightNumber)) {
    return NextResponse.json({ suggestions: [], valid: false });
  }

  try {
    const suggestions = await lookupFlightRouteSuggestions(flightNumber);
    return NextResponse.json({ suggestions, valid: true });
  } catch (error) {
    const message =
      error instanceof TripServiceError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to look up this flight";
    return NextResponse.json({ error: message, suggestions: [] }, { status: 400 });
  }
}
