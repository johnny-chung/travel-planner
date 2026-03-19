import "server-only";

import { connectDB } from "@/lib/mongodb";
import { Stop } from "@/lib/models/Stop";
import { TripStay } from "@/lib/models/TripStay";
import { TripTransport } from "@/lib/models/TripTransport";
import { Trip } from "@/lib/models/Trip";

type ArrivalEntry = {
  date?: unknown;
};

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeTravelDates(dates: string[]) {
  return [...new Set(dates.filter(isDateString))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function collectTravelDatesFromArrivals(arrivals: unknown) {
  if (!Array.isArray(arrivals)) {
    return [];
  }

  return normalizeTravelDates(
    arrivals.flatMap((arrival) => {
      const date = (arrival as ArrivalEntry | null)?.date;
      return isDateString(date) ? [date] : [];
    }),
  );
}

function collectDateRange(startDate: string, endDate: string) {
  if (!isDateString(startDate) || !isDateString(endDate)) {
    return [];
  }

  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export async function syncTripTravelDates(tripId: string) {
  await connectDB();

  const [stops, transports, stays] = (await Promise.all([
    Stop.find({ planId: tripId }).select("arrivals").lean(),
    TripTransport.find({ tripId }).select("departureDate arrivalDate").lean(),
    TripStay.find({ tripId }).select("checkInDate checkOutDate").lean(),
  ])) as [
    Array<{ arrivals?: unknown }>,
    Array<{ departureDate?: string; arrivalDate?: string }>,
    Array<{ checkInDate?: string; checkOutDate?: string }>,
  ];

  const travelDates = normalizeTravelDates(
    [
      ...stops.flatMap((stop) => collectTravelDatesFromArrivals(stop.arrivals)),
      ...transports.flatMap((transport) => [
        transport.departureDate,
        transport.arrivalDate,
      ]),
      ...stays.flatMap((stay) =>
        collectDateRange(stay.checkInDate ?? "", stay.checkOutDate ?? ""),
      ),
    ].filter(isDateString),
  );

  await Trip.findByIdAndUpdate(tripId, { travelDates });
  return travelDates;
}
