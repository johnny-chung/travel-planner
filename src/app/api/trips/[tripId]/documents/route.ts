import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  TripServiceError,
  addTripDocumentForUser,
  removeTripDocumentForUser,
} from "@/features/trips/service";

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

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  const body = await request.json();

  try {
    const documents = await addTripDocumentForUser(tripId, session.user.id, {
      name: body.name ?? "",
      url: body.url ?? "",
    });

    return NextResponse.json(documents, { status: 201 });
  } catch (error) {
    if (error instanceof TripServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: getStatusCode(error) },
      );
    }

    return NextResponse.json({ error: "Failed to add document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  const documentId = new URL(request.url).searchParams.get("docId");
  if (!documentId) {
    return NextResponse.json({ error: "docId required" }, { status: 400 });
  }

  try {
    await removeTripDocumentForUser(tripId, session.user.id, documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TripServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: getStatusCode(error) },
      );
    }

    return NextResponse.json({ error: "Failed to remove document" }, { status: 500 });
  }
}
