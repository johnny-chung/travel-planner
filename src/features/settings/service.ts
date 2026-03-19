import "server-only";

import { cache } from "react";
import { connectDB } from "@/lib/mongodb";
import { AppSettings } from "@/lib/models/AppSettings";
import type { MembershipStatus } from "@/types/travel";

export type AppLimits = {
  basicActiveTrips: number;
  basicArchivedTrips: number;
  basicEditorTrips: number;
  basicEditorsPerTrip: number;
  basicRouteCallsPerMonth: number;
  proRouteCallsPerMonth: number;
  guestActiveTrips: number;
  guestStops: number;
  globalRouteCallsPerMonth: number;
};

export const DEFAULT_APP_LIMITS: AppLimits = {
  basicActiveTrips: 2,
  basicArchivedTrips: 3,
  basicEditorTrips: 5,
  basicEditorsPerTrip: 5,
  basicRouteCallsPerMonth: 30,
  proRouteCallsPerMonth: 100,
  guestActiveTrips: 1,
  guestStops: 5,
  globalRouteCallsPerMonth: 10000,
};

type RawAppSettings = {
  limits?: Partial<Record<keyof AppLimits, unknown>>;
};

function resolveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

export const getAppLimits = cache(async (): Promise<AppLimits> => {
  await connectDB();

  const settings = (await AppSettings.findOne({ key: "default" }).lean()) as RawAppSettings | null;
  const limits = settings?.limits ?? {};

  return {
    basicActiveTrips: resolveNumber(limits.basicActiveTrips, DEFAULT_APP_LIMITS.basicActiveTrips),
    basicArchivedTrips: resolveNumber(limits.basicArchivedTrips, DEFAULT_APP_LIMITS.basicArchivedTrips),
    basicEditorTrips: resolveNumber(limits.basicEditorTrips, DEFAULT_APP_LIMITS.basicEditorTrips),
    basicEditorsPerTrip: resolveNumber(limits.basicEditorsPerTrip, DEFAULT_APP_LIMITS.basicEditorsPerTrip),
    basicRouteCallsPerMonth: resolveNumber(
      limits.basicRouteCallsPerMonth,
      DEFAULT_APP_LIMITS.basicRouteCallsPerMonth,
    ),
    proRouteCallsPerMonth: resolveNumber(
      limits.proRouteCallsPerMonth,
      DEFAULT_APP_LIMITS.proRouteCallsPerMonth,
    ),
    guestActiveTrips: resolveNumber(limits.guestActiveTrips, DEFAULT_APP_LIMITS.guestActiveTrips),
    guestStops: resolveNumber(limits.guestStops, DEFAULT_APP_LIMITS.guestStops),
    globalRouteCallsPerMonth: resolveNumber(
      limits.globalRouteCallsPerMonth,
      DEFAULT_APP_LIMITS.globalRouteCallsPerMonth,
    ),
  };
});

export async function getRouteCallLimitForMembership(
  membershipStatus: MembershipStatus,
) {
  const limits = await getAppLimits();
  return membershipStatus === "pro"
    ? limits.proRouteCallsPerMonth
    : limits.basicRouteCallsPerMonth;
}
