import "server-only";

import { archiveTripAndDelete } from "@/features/trips/archive";
import { getAppLimits } from "@/features/settings/service";
import { TripServiceError } from "@/features/trips/errors";
import {
  buildTripCapabilities,
  canActorAccessTrip,
  type TripActor,
} from "@/features/trips/access";
import { connectDB } from "@/lib/mongodb";
import { normalizeTravelDates } from "@/features/trips/travel-dates";
import { Expense } from "@/lib/models/Expense";
import { Trip, generateShareCode } from "@/lib/models/Trip";
import { User } from "@/lib/models/User";
import {
  getStayItemsForTrip,
  getTransportItemsForTrip,
} from "@/features/trip-logistics/service";
import type {
  MembershipStatus,
  NotificationItem,
  TransportMode,
  TripDetail,
  TripDocument,
  TripMember,
  TripRole,
  TripStatus,
  TripSummary,
} from "@/types/travel";

export { TripServiceError } from "@/features/trips/errors";

type LocationInput = {
  location?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPlaceId?: string;
  locationCountryCode?: string;
  locationThumbnail?: string;
};

type CreateTripInput = LocationInput & {
  name: string;
  description?: string;
  transportMode?: TransportMode;
};

type RawTrip = {
  _id: unknown;
  ownerType?: "user" | "guest";
  userId?: string;
  guestId?: string | null;
  name: string;
  description?: string;
  centerName?: string;
  centerPlaceId?: string;
  centerCountryCode?: string;
  centerThumbnail?: string;
  centerLat?: number | null;
  centerLng?: number | null;
  createdAt?: Date;
  travelDates?: string[];
  shareCode?: string;
  status?: TripStatus;
  editors?: string[];
  pendingEditors?: Array<{
    userId: string;
    name: string;
    email: string;
    requestedAt: Date;
  }>;
  documents?: Array<{ _id: unknown; name: string; url: string }>;
  transportMode?: TransportMode;
};

type MembershipRecord = {
  membershipStatus?: MembershipStatus;
};

type UserRecord = {
  userId: string;
  name: string;
  email: string;
  image: string;
  membershipStatus?: MembershipStatus;
};

function serializeTripSummary(trip: RawTrip, role: TripRole): TripSummary {
  return {
    _id: String(trip._id),
    name: trip.name,
    description: trip.description ?? "",
    centerName: trip.centerName ?? "",
    centerPlaceId: trip.centerPlaceId ?? "",
    centerCountryCode: trip.centerCountryCode ?? "",
    centerThumbnail: trip.centerThumbnail ?? "",
    centerLat: trip.centerLat ?? null,
    centerLng: trip.centerLng ?? null,
    createdAt: trip.createdAt ? new Date(trip.createdAt).toISOString() : "",
    travelDates: normalizeTravelDates(trip.travelDates ?? []),
    role,
    shareCode: trip.shareCode ?? "",
    status: trip.status ?? "active",
    transportMode: trip.transportMode ?? "transit",
  };
}

async function resolveLocation({
  location,
  locationLat,
  locationLng,
  locationPlaceId,
  locationCountryCode,
  locationThumbnail,
}: LocationInput) {
  if (typeof locationLat === "number" && typeof locationLng === "number") {
    return {
      centerLat: locationLat,
      centerLng: locationLng,
      centerName: location?.trim() ?? "",
      centerPlaceId: locationPlaceId?.trim() ?? "",
      centerCountryCode: locationCountryCode?.trim().toUpperCase() ?? "",
      centerThumbnail: locationThumbnail?.trim() ?? "",
    };
  }

  if (!location?.trim()) {
    return {
      centerLat: null,
      centerLng: null,
      centerName: "",
      centerPlaceId: "",
      centerCountryCode: "",
      centerThumbnail: "",
    };
  }

  try {
    const apiKey =
      process.env.GOOGLE_MAPS_SERVER_API_KEY ??
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location.trim(),
      )}&key=${apiKey}`,
      { cache: "no-store" },
    );
    const result = await response.json();

    if (result.status === "OK" && result.results?.[0]) {
      const match = result.results[0];
      return {
        centerLat: match.geometry.location.lat as number,
        centerLng: match.geometry.location.lng as number,
        centerName: (match.formatted_address as string) ?? location.trim(),
        centerPlaceId: locationPlaceId?.trim() ?? "",
        centerCountryCode:
          (match.address_components as Array<{ short_name?: string; types?: string[] }>)
            ?.find((component) => component.types?.includes("country"))
            ?.short_name?.toUpperCase() ??
          locationCountryCode?.trim().toUpperCase() ??
          "",
        centerThumbnail: locationThumbnail?.trim() ?? "",
      };
    }
  } catch {
    // Geocoding is best-effort.
  }

  return {
    centerLat: null,
    centerLng: null,
    centerName: location.trim(),
    centerPlaceId: locationPlaceId?.trim() ?? "",
    centerCountryCode: locationCountryCode?.trim().toUpperCase() ?? "",
    centerThumbnail: locationThumbnail?.trim() ?? "",
  };
}

async function generateUniqueShareCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateShareCode();
    const existing = await Trip.findOne({ shareCode: candidate }).lean();
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Could not generate unique share code");
}

async function getMembershipStatus(userId: string): Promise<MembershipStatus> {
  const user = (await User.findOne({ userId })
    .select("membershipStatus")
    .lean()) as MembershipRecord | null;
  return user?.membershipStatus ?? "basic";
}

function buildTripQueryForActor(actor: TripActor) {
  if (actor.kind === "guest") {
    return { ownerType: "guest", guestId: actor.guestId, status: { $ne: "deleted" } };
  }

  return { ownerType: { $ne: "guest" }, userId: actor.userId, status: { $ne: "deleted" } };
}

async function getTripDetailForActor(
  tripId: string,
  actor: TripActor,
): Promise<{
  trip: TripDetail;
  members: TripMember[];
  totalExpense: number;
}> {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (!trip || !canActorAccessTrip(trip, actor)) {
    return Promise.reject(new TripServiceError("NOT_FOUND", "Trip not found"));
  }

  const capabilities = buildTripCapabilities(actor);
  const isUserOwned = (trip.ownerType ?? "user") !== "guest";

  if (!isUserOwned) {
    const [transportItems, stayItems] = await Promise.all([
      getTransportItemsForTrip(tripId),
      getStayItemsForTrip(tripId),
    ]);

    return {
      trip: {
        _id: String(trip._id),
        name: trip.name,
        description: trip.description ?? "",
        centerName: trip.centerName ?? "",
        centerPlaceId: trip.centerPlaceId ?? "",
        centerCountryCode: trip.centerCountryCode ?? "",
        centerThumbnail: trip.centerThumbnail ?? "",
        shareCode: trip.shareCode ?? "",
        role: "owner",
        userId: trip.userId ?? "",
        status: trip.status ?? "active",
        documents: [],
        membershipStatus: "basic",
        transportItems,
        stayItems,
        capabilities,
      },
      members: [
        {
          userId: `guest:${trip.guestId ?? "trial"}`,
          name: "Guest Trial",
          email: "",
          image: "",
          isOwner: true,
        },
      ],
      totalExpense: 0,
    };
  }

  const memberIds = [trip.userId ?? "", ...(trip.editors ?? [])].filter(Boolean);
  const [users, expenses, membershipStatus, transportItems, stayItems] = await Promise.all([
    User.find({ userId: { $in: memberIds } }).lean() as Promise<UserRecord[]>,
    Expense.find({ tripId }).lean() as Promise<Array<{ amount?: number }>>,
    getMembershipStatus(actor.kind === "user" ? actor.userId : ""),
    getTransportItemsForTrip(tripId),
    getStayItemsForTrip(tripId),
  ]);

  const members = memberIds.map((memberId) => {
    const user = users.find((candidate) => candidate.userId === memberId);
    return {
      userId: memberId,
      name: user?.name ?? memberId,
      email: user?.email ?? "",
      image: user?.image ?? "",
      isOwner: memberId === trip.userId,
    };
  });

  const isOwner = actor.kind === "user" && trip.userId === actor.userId;

  return {
    trip: {
      _id: String(trip._id),
      name: trip.name,
      description: trip.description ?? "",
      centerName: trip.centerName ?? "",
      centerPlaceId: trip.centerPlaceId ?? "",
      centerCountryCode: trip.centerCountryCode ?? "",
      centerThumbnail: trip.centerThumbnail ?? "",
      shareCode: trip.shareCode ?? "",
      role: isOwner ? "owner" : "editor",
      userId: trip.userId ?? "",
      status: trip.status ?? "active",
      documents: (trip.documents ?? []).map(
        (document): TripDocument => ({
          _id: String(document._id),
          name: document.name,
          url: document.url,
        }),
      ),
      membershipStatus,
      transportItems,
      stayItems,
      capabilities,
    },
    members,
    totalExpense: expenses.reduce(
      (sum, expense) => sum + (expense.amount ?? 0),
      0,
    ),
  };
}

function collectTrips(
  ownedTrips: RawTrip[],
  editorTrips: RawTrip[],
  pendingTrips: RawTrip[],
) {
  const tripMap = new Map<string, TripSummary>();

  for (const trip of ownedTrips) {
    tripMap.set(String(trip._id), serializeTripSummary(trip, "owner"));
  }

  for (const trip of editorTrips) {
    const id = String(trip._id);
    if (!tripMap.has(id)) {
      tripMap.set(id, serializeTripSummary(trip, "editor"));
    }
  }

  for (const trip of pendingTrips) {
    const id = String(trip._id);
    if (!tripMap.has(id)) {
      tripMap.set(id, serializeTripSummary(trip, "pending"));
    }
  }

  return [...tripMap.values()].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function getTripSummariesForUser(userId: string) {
  await connectDB();

  const [ownedTrips, editorTrips, pendingTrips] = (await Promise.all([
    Trip.find({ userId, ownerType: { $ne: "guest" }, status: { $ne: "deleted" } })
      .sort({ createdAt: -1 })
      .lean(),
    Trip.find({ editors: userId, status: { $ne: "deleted" } })
      .sort({ createdAt: -1 })
      .lean(),
    Trip.find({
      "pendingEditors.userId": userId,
      status: { $ne: "deleted" },
    })
      .sort({ createdAt: -1 })
      .lean(),
  ])) as [RawTrip[], RawTrip[], RawTrip[]];

  return collectTrips(ownedTrips, editorTrips, pendingTrips);
}

export async function getTrialTripSummariesForGuest(guestId: string) {
  await connectDB();

  const trips = (await Trip.find(buildTripQueryForActor({ kind: "guest", guestId }))
    .sort({ createdAt: -1 })
    .lean()) as RawTrip[];

  return trips.map((trip) => serializeTripSummary(trip, "owner"));
}

export async function getRecentTripSummariesForUser(
  userId: string,
  limit = 3,
) {
  const trips = await getTripSummariesForUser(userId);
  return trips.slice(0, limit);
}

export async function getTripDetailForUser(
  tripId: string,
  userId: string,
): Promise<{
  trip: TripDetail;
  members: TripMember[];
  totalExpense: number;
}> {
  return getTripDetailForActor(tripId, { kind: "user", userId });
}

export async function getTripDetailForGuest(
  tripId: string,
  guestId: string,
): Promise<{
  trip: TripDetail;
  members: TripMember[];
  totalExpense: number;
}> {
  return getTripDetailForActor(tripId, { kind: "guest", guestId });
}

export async function createTripForUser(userId: string, input: CreateTripInput) {
  const name = input.name.trim();
  if (!name) {
    throw new TripServiceError("VALIDATION_ERROR", "Name is required");
  }

  await connectDB();

  const membershipStatus = await getMembershipStatus(userId);
  if (membershipStatus === "basic") {
    const limits = await getAppLimits();
    const activeOwned = await Trip.countDocuments({
      userId,
      ownerType: { $ne: "guest" },
      status: "active",
    });
    if (activeOwned >= limits.basicActiveTrips) {
      throw new TripServiceError(
        "LIMIT_REACHED",
        `Your Basic plan includes ${limits.basicActiveTrips} active trip${limits.basicActiveTrips === 1 ? "" : "s"}. To create a new one, upgrade to Pro or archive/delete an existing trip.`,
      );
    }
  }

  const [location, shareCode] = await Promise.all([
    resolveLocation(input),
    generateUniqueShareCode(),
  ]);

  return Trip.create({
    ownerType: "user",
    userId,
    name,
    description: input.description?.trim() ?? "",
    shareCode,
    travelDates: [],
    transportMode: input.transportMode ?? "transit",
    ...location,
  });
}

export async function createTrialTripForGuest(
  guestId: string,
  input: CreateTripInput,
) {
  const name = input.name.trim();
  if (!name) {
    throw new TripServiceError("VALIDATION_ERROR", "Name is required");
  }

  await connectDB();

  const limits = await getAppLimits();
  const activeOwned = await Trip.countDocuments({
    ownerType: "guest",
    guestId,
    status: "active",
  });
  if (activeOwned >= limits.guestActiveTrips) {
    throw new TripServiceError(
      "LIMIT_REACHED",
      `Guest trial supports ${limits.guestActiveTrips} active trip${limits.guestActiveTrips === 1 ? "" : "s"} at a time. Sign up to keep planning more.`,
    );
  }

  const [location, shareCode] = await Promise.all([
    resolveLocation(input),
    generateUniqueShareCode(),
  ]);

  return Trip.create({
    ownerType: "guest",
    guestId,
    userId: "",
    name,
    description: input.description?.trim() ?? "",
    shareCode,
    travelDates: [],
    transportMode: input.transportMode ?? "transit",
    ...location,
  });
}

export async function claimGuestTripsForUser(guestId: string, userId: string) {
  await connectDB();

  const guestTrips = (await Trip.find({
    ownerType: "guest",
    guestId,
    status: { $ne: "deleted" },
  })) as Array<InstanceType<typeof Trip>>;

  if (guestTrips.length === 0) {
    return null;
  }

  let claimedTripId: string | null = null;

  for (const trip of guestTrips) {
    trip.ownerType = "user";
    trip.userId = userId;
    trip.guestId = null;
    if (!trip.shareCode) {
      trip.shareCode = await generateUniqueShareCode();
    }
    await trip.save();
    claimedTripId = String(trip._id);
  }

  return claimedTripId;
}

export async function joinTripForUser(
  userId: string,
  shareCode: string,
  fallbackProfile: { name?: string | null; email?: string | null },
) {
  await connectDB();

  const normalizedShareCode = shareCode.trim().toUpperCase();
  if (!normalizedShareCode) {
    throw new TripServiceError("VALIDATION_ERROR", "Share code required");
  }

  const trip = await Trip.findOne({ shareCode: normalizedShareCode });
  if (!trip) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  if ((trip.ownerType ?? "user") === "guest") {
    throw new TripServiceError(
      "INVALID_STATE",
      "Guest trial trips cannot be shared with collaborators.",
    );
  }

  if (trip.userId === userId) {
    throw new TripServiceError("INVALID_STATE", "You own this trip");
  }

  if (trip.editors?.includes(userId)) {
    throw new TripServiceError("INVALID_STATE", "Already an editor");
  }

  if (
    trip.pendingEditors?.some(
      (editor: { userId: string }) => editor.userId === userId,
    )
  ) {
    throw new TripServiceError("INVALID_STATE", "Already pending approval");
  }

  const user = (await User.findOne({ userId }).lean()) as UserRecord | null;
  if ((user?.membershipStatus ?? "basic") === "basic") {
    const limits = await getAppLimits();
    const editorTrips = await Trip.countDocuments({
      editors: userId,
      status: { $ne: "deleted" },
    });

    if (editorTrips >= limits.basicEditorTrips) {
      throw new TripServiceError(
        "LIMIT_REACHED",
        `Basic plan allows editing ${limits.basicEditorTrips} trip${limits.basicEditorTrips === 1 ? "" : "s"}. Upgrade to Pro for more.`,
      );
    }
  }

  trip.pendingEditors.push({
    userId,
    name: user?.name ?? fallbackProfile.name ?? "",
    email: user?.email ?? fallbackProfile.email ?? "",
    requestedAt: new Date(),
  });
  await trip.save();

  return trip.name as string;
}

export async function updateTripStatusForUser(
  tripId: string,
  userId: string,
  status: Exclude<TripStatus, "deleted">,
) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (!trip) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  const canAccess = trip.userId === userId || (trip.editors ?? []).includes(userId);
  if (!canAccess) {
    throw new TripServiceError("FORBIDDEN", "Trip not found");
  }

  const currentStatus = trip.status ?? "active";
  const membershipStatus = await getMembershipStatus(userId);
  if (membershipStatus === "basic") {
    const limits = await getAppLimits();

    if (status === "archived" && currentStatus !== "archived") {
      const archivedOwned = await Trip.countDocuments({
        userId,
        ownerType: { $ne: "guest" },
        status: "archived",
      });
      if (archivedOwned >= limits.basicArchivedTrips) {
        throw new TripServiceError(
          "LIMIT_REACHED",
          `Your Basic plan includes ${limits.basicArchivedTrips} archived trip${limits.basicArchivedTrips === 1 ? "" : "s"}. Delete an archived trip or upgrade to Pro to archive more.`,
        );
      }
    }

    if (status === "active" && currentStatus !== "active") {
      const activeOwned = await Trip.countDocuments({
        userId,
        ownerType: { $ne: "guest" },
        status: "active",
      });
      if (activeOwned >= limits.basicActiveTrips) {
        throw new TripServiceError(
          "LIMIT_REACHED",
          `Your Basic plan includes ${limits.basicActiveTrips} active trip${limits.basicActiveTrips === 1 ? "" : "s"}. Archive or delete another trip, or upgrade to Pro to restore more.`,
        );
      }
    }
  }

  return Trip.findByIdAndUpdate(tripId, { status }, { new: true }).lean();
}

export async function deleteTripForUser(tripId: string, userId: string) {
  const deleted = await archiveTripAndDelete(tripId, userId);
  if (!deleted) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }
}

export async function removeTripMemberForUser(
  tripId: string,
  ownerId: string,
  memberId: string,
) {
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId });
  if (!trip) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  if (trip.userId !== ownerId) {
    throw new TripServiceError("FORBIDDEN", "Forbidden");
  }

  trip.editors = (trip.editors ?? []).filter((id: string) => id !== memberId);
  trip.pendingEditors = (trip.pendingEditors ?? []).filter(
    (editor: { userId: string }) => editor.userId !== memberId,
  );
  await trip.save();
}

export async function addTripDocumentForUser(
  tripId: string,
  userId: string,
  input: { name: string; url: string },
) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (!trip) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  const canAccess = trip.userId === userId || (trip.editors ?? []).includes(userId);
  if (!canAccess) {
    throw new TripServiceError("FORBIDDEN", "Trip not found");
  }

  if ((trip.status ?? "active") === "archived") {
    throw new TripServiceError("INVALID_STATE", "Trip is archived");
  }

  const name = input.name.trim();
  const url = input.url.trim();

  if (!name || !url) {
    throw new TripServiceError(
      "VALIDATION_ERROR",
      "Name and URL are required",
    );
  }

  if (!url.includes("google.com")) {
    throw new TripServiceError(
      "VALIDATION_ERROR",
      "URL must be a Google link",
    );
  }

  const updated = (await Trip.findByIdAndUpdate(
    tripId,
    { $push: { documents: { name, url } } },
    { new: true, select: "documents" },
  ).lean()) as { documents?: RawTrip["documents"] } | null;

  return (updated?.documents ?? []).map(
    (document): TripDocument => ({
      _id: String(document?._id),
      name: document?.name ?? "",
      url: document?.url ?? "",
    }),
  );
}

export async function removeTripDocumentForUser(
  tripId: string,
  userId: string,
  documentId: string,
) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (!trip) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  const canAccess = trip.userId === userId || (trip.editors ?? []).includes(userId);
  if (!canAccess) {
    throw new TripServiceError("FORBIDDEN", "Trip not found");
  }

  await Trip.findByIdAndUpdate(tripId, {
    $pull: { documents: { _id: documentId } },
  });
}

export async function getTripNotificationsForOwner(userId: string) {
  await connectDB();

  const trips = (await Trip.find({
    userId,
    "pendingEditors.0": { $exists: true },
  }).lean()) as RawTrip[];

  return trips.flatMap(
    (trip): NotificationItem[] =>
      (trip.pendingEditors ?? []).map((editor) => ({
        planId: String(trip._id),
        planName: trip.name,
        userId: editor.userId,
        name: editor.name,
        email: editor.email,
        requestedAt: new Date(editor.requestedAt).toISOString(),
      })),
  );
}

export async function approveTripRequestForOwner(
  tripId: string,
  ownerId: string,
  userId: string,
) {
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId, userId: ownerId });
  if (!trip) {
    throw new TripServiceError("FORBIDDEN", "Not found or not owner");
  }

  const pendingIndex = trip.pendingEditors.findIndex(
    (editor: { userId: string }) => editor.userId === userId,
  );

  if (pendingIndex === -1) {
    throw new TripServiceError("NOT_FOUND", "Not in pending list");
  }

  const membershipStatus = await getMembershipStatus(ownerId);
  if (membershipStatus === "basic") {
    const limits = await getAppLimits();
    if (trip.editors.length >= limits.basicEditorsPerTrip) {
      throw new TripServiceError(
        "LIMIT_REACHED",
        `Basic plan allows up to ${limits.basicEditorsPerTrip} editor${limits.basicEditorsPerTrip === 1 ? "" : "s"} per trip. Upgrade to Pro for more collaborators.`,
      );
    }
  }

  trip.pendingEditors.splice(pendingIndex, 1);
  if (!trip.editors.includes(userId)) {
    trip.editors.push(userId);
  }

  await trip.save();
}

export async function denyTripRequestForOwner(
  tripId: string,
  ownerId: string,
  userId: string,
) {
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId, userId: ownerId });
  if (!trip) {
    throw new TripServiceError("FORBIDDEN", "Not found or not owner");
  }

  const pendingIndex = trip.pendingEditors.findIndex(
    (editor: { userId: string }) => editor.userId === userId,
  );

  if (pendingIndex === -1) {
    throw new TripServiceError("NOT_FOUND", "Not in pending list");
  }

  trip.pendingEditors.splice(pendingIndex, 1);
  await trip.save();
}
