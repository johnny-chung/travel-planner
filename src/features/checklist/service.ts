import "server-only";

import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Trip";
import { TripChecklistItem } from "@/lib/models/TripChecklistItem";
import { User } from "@/lib/models/User";
import {
  canActorAccessTrip,
  type TripActor,
} from "@/features/trips/access";
import { TripServiceError } from "@/features/trips/errors";
import type { ChecklistItem, ChecklistPageData } from "@/features/checklist/types";

const CHECKLIST_TEXT_MAX_LENGTH = 800;

type RawChecklistItem = {
  _id: unknown;
  text?: string;
  isCompleted?: boolean;
  checkedBy?: string;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type RawTrip = {
  _id: unknown;
  name?: string;
  status?: string;
  userId?: string;
  guestId?: string | null;
  ownerType?: "user" | "guest";
  editors?: string[];
};

function serializeChecklistItem(item: RawChecklistItem): ChecklistItem {
  return {
    _id: String(item._id),
    text: item.text ?? "",
    isCompleted: item.isCompleted ?? false,
    checkedBy: item.checkedBy ?? "",
    completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : "",
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
  };
}

async function getTripForActor(tripId: string, actor: TripActor) {
  await connectDB();

  const trip = (await Trip.findById(tripId).lean()) as RawTrip | null;
  if (!trip || !canActorAccessTrip(trip, actor)) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  return trip;
}

async function getChecklistPageDataForActor(
  tripId: string,
  actor: TripActor,
): Promise<ChecklistPageData> {
  const trip = await getTripForActor(tripId, actor);
  const items = (await TripChecklistItem.find({ tripId })
    .sort({ createdAt: 1, _id: 1 })
    .lean()) as RawChecklistItem[];

  return {
    tripId,
    tripName: trip.name ?? "Checklist",
    isArchived: (trip.status ?? "active") === "archived",
    items: items.map(serializeChecklistItem),
  };
}

type ChecklistInput = {
  text: string;
};

async function getActorDisplayName(actor: TripActor) {
  if (actor.kind === "guest") {
    return "Guest Trial";
  }

  const user = (await User.findOne({ userId: actor.userId })
    .select("name username email")
    .lean()) as
    | { name?: string; username?: string; email?: string }
    | null;

  return (
    user?.name?.trim() ||
    user?.username?.trim() ||
    user?.email?.trim() ||
    "Trip member"
  );
}

async function createChecklistItemForActor(
  tripId: string,
  actor: TripActor,
  input: ChecklistInput,
) {
  const trip = await getTripForActor(tripId, actor);
  if ((trip.status ?? "active") === "archived") {
    throw new TripServiceError("INVALID_STATE", "Trip is archived");
  }

  const text = input.text.trim();
  if (!text) {
    throw new TripServiceError("VALIDATION_ERROR", "Checklist item is required");
  }
  if (text.length > CHECKLIST_TEXT_MAX_LENGTH) {
    throw new TripServiceError(
      "VALIDATION_ERROR",
      `Checklist item must be ${CHECKLIST_TEXT_MAX_LENGTH} characters or fewer`,
    );
  }

  await TripChecklistItem.create({
    tripId,
    text,
  });
}

async function updateChecklistItemForActor(
  tripId: string,
  itemId: string,
  actor: TripActor,
  input: ChecklistInput,
) {
  const trip = await getTripForActor(tripId, actor);
  if ((trip.status ?? "active") === "archived") {
    throw new TripServiceError("INVALID_STATE", "Trip is archived");
  }

  const text = input.text.trim();
  if (!text) {
    throw new TripServiceError("VALIDATION_ERROR", "Checklist item is required");
  }
  if (text.length > CHECKLIST_TEXT_MAX_LENGTH) {
    throw new TripServiceError(
      "VALIDATION_ERROR",
      `Checklist item must be ${CHECKLIST_TEXT_MAX_LENGTH} characters or fewer`,
    );
  }

  const updated = await TripChecklistItem.findOneAndUpdate(
    { _id: itemId, tripId },
    {
      text,
    },
    { new: true },
  );

  if (!updated) {
    throw new TripServiceError("NOT_FOUND", "Checklist item not found");
  }
}

async function setChecklistItemCompletedForActor(
  tripId: string,
  itemId: string,
  actor: TripActor,
  isCompleted: boolean,
) {
  const trip = await getTripForActor(tripId, actor);
  if ((trip.status ?? "active") === "archived") {
    throw new TripServiceError("INVALID_STATE", "Trip is archived");
  }

  const checkedBy = isCompleted ? await getActorDisplayName(actor) : "";

  const updated = await TripChecklistItem.findOneAndUpdate(
    { _id: itemId, tripId },
    {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
      checkedBy,
    },
    { new: true },
  );

  if (!updated) {
    throw new TripServiceError("NOT_FOUND", "Checklist item not found");
  }
}

async function deleteChecklistItemForActor(
  tripId: string,
  itemId: string,
  actor: TripActor,
) {
  const trip = await getTripForActor(tripId, actor);
  if ((trip.status ?? "active") === "archived") {
    throw new TripServiceError("INVALID_STATE", "Trip is archived");
  }

  const deleted = await TripChecklistItem.findOneAndDelete({ _id: itemId, tripId });
  if (!deleted) {
    throw new TripServiceError("NOT_FOUND", "Checklist item not found");
  }
}

export function getChecklistPageDataForUser(tripId: string, userId: string) {
  return getChecklistPageDataForActor(tripId, { kind: "user", userId });
}

export function getChecklistPageDataForGuest(tripId: string, guestId: string) {
  return getChecklistPageDataForActor(tripId, { kind: "guest", guestId });
}

export function createChecklistItemForUser(
  tripId: string,
  userId: string,
  input: ChecklistInput,
) {
  return createChecklistItemForActor(tripId, { kind: "user", userId }, input);
}

export function createChecklistItemForGuest(
  tripId: string,
  guestId: string,
  input: ChecklistInput,
) {
  return createChecklistItemForActor(tripId, { kind: "guest", guestId }, input);
}

export function updateChecklistItemForUser(
  tripId: string,
  itemId: string,
  userId: string,
  input: ChecklistInput,
) {
  return updateChecklistItemForActor(
    tripId,
    itemId,
    { kind: "user", userId },
    input,
  );
}

export function updateChecklistItemForGuest(
  tripId: string,
  itemId: string,
  guestId: string,
  input: ChecklistInput,
) {
  return updateChecklistItemForActor(
    tripId,
    itemId,
    { kind: "guest", guestId },
    input,
  );
}

export function setChecklistItemCompletedForUser(
  tripId: string,
  itemId: string,
  userId: string,
  isCompleted: boolean,
) {
  return setChecklistItemCompletedForActor(
    tripId,
    itemId,
    { kind: "user", userId },
    isCompleted,
  );
}

export function setChecklistItemCompletedForGuest(
  tripId: string,
  itemId: string,
  guestId: string,
  isCompleted: boolean,
) {
  return setChecklistItemCompletedForActor(
    tripId,
    itemId,
    { kind: "guest", guestId },
    isCompleted,
  );
}

export function deleteChecklistItemForUser(
  tripId: string,
  itemId: string,
  userId: string,
) {
  return deleteChecklistItemForActor(tripId, itemId, { kind: "user", userId });
}

export function deleteChecklistItemForGuest(
  tripId: string,
  itemId: string,
  guestId: string,
) {
  return deleteChecklistItemForActor(tripId, itemId, { kind: "guest", guestId });
}
