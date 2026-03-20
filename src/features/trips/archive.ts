import "server-only";

import { connectDB } from "@/lib/mongodb";
import { ArchivedExpense } from "@/lib/models/ArchivedExpense";
import { ArchivedStop } from "@/lib/models/ArchivedStop";
import { ArchivedTripStay } from "@/lib/models/ArchivedTripStay";
import { ArchivedTripTransport } from "@/lib/models/ArchivedTripTransport";
import { ArchivedTripChecklistItem } from "@/lib/models/ArchivedTripChecklistItem";
import { ArchivedTrip } from "@/lib/models/ArchivedTrip";
import { Expense } from "@/lib/models/Expense";
import { Stop } from "@/lib/models/Stop";
import { TravelTime } from "@/lib/models/TravelTime";
import { TripChecklistItem } from "@/lib/models/TripChecklistItem";
import { TripStay } from "@/lib/models/TripStay";
import { TripTransport } from "@/lib/models/TripTransport";
import { Trip } from "@/lib/models/Trip";

type ArchiveSource = Record<string, unknown> & {
  _id?: unknown;
  __v?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toArchiveDocument(record: ArchiveSource, archivedBy: string) {
  const { _id, ...rest } = record;
  delete rest.__v;

  return {
    ...rest,
    originalId: String(_id ?? ""),
    archivedAt: new Date(),
    archivedBy,
  };
}

async function deleteTripRelatedData(tripId: string, ownerId: string) {
  await Promise.all([
    Trip.deleteOne({ _id: tripId, userId: ownerId }),
    Stop.deleteMany({ planId: tripId }),
    Expense.deleteMany({ tripId }),
    TripTransport.deleteMany({ tripId }),
    TripStay.deleteMany({ tripId }),
    TripChecklistItem.deleteMany({ tripId }),
    TravelTime.deleteMany({ planId: tripId }),
  ]);
}

export async function archiveTripAndDelete(tripId: string, ownerId: string) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId, userId: ownerId }).lean()) as
    | ArchiveSource
    | null;
  if (!trip) {
    return false;
  }

  const [stops, expenses, transports, stays, checklistItems] = (await Promise.all([
    Stop.find({ planId: tripId }).lean(),
    Expense.find({ tripId }).lean(),
    TripTransport.find({ tripId }).lean(),
    TripStay.find({ tripId }).lean(),
    TripChecklistItem.find({ tripId }).lean(),
  ])) as [
    ArchiveSource[],
    ArchiveSource[],
    ArchiveSource[],
    ArchiveSource[],
    ArchiveSource[],
  ];

  if (stops.length < 5) {
    await deleteTripRelatedData(tripId, ownerId);
    return true;
  }

  await ArchivedTrip.create({
    ...toArchiveDocument(trip, ownerId),
    status: "deleted",
  });

  if (stops.length > 0) {
    await ArchivedStop.insertMany(
      stops.map((stop) => toArchiveDocument(stop, ownerId)),
    );
  }

  if (expenses.length > 0) {
    await ArchivedExpense.insertMany(
      expenses.map((expense) => toArchiveDocument(expense, ownerId)),
    );
  }

  if (transports.length > 0) {
    await ArchivedTripTransport.insertMany(
      transports.map((transport) => toArchiveDocument(transport, ownerId)),
    );
  }

  if (stays.length > 0) {
    await ArchivedTripStay.insertMany(
      stays.map((stay) => toArchiveDocument(stay, ownerId)),
    );
  }

  if (checklistItems.length > 0) {
    await ArchivedTripChecklistItem.insertMany(
      checklistItems.map((item) => toArchiveDocument(item, ownerId)),
    );
  }

  await deleteTripRelatedData(tripId, ownerId);

  return true;
}
