import "server-only";

import { cache } from "react";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Trip";
import { User } from "@/lib/models/User";
import type { MembershipStatus } from "@/types/travel";

type NavigationSummary = {
  membershipStatus: MembershipStatus;
  notificationCount: number;
};

export const getNavigationSummary = cache(
  async (userId: string): Promise<NavigationSummary> => {
    await connectDB();

    const [user, ownedTrips] = await Promise.all([
      User.findOne({ userId }).select("membershipStatus").lean() as Promise<
        { membershipStatus?: MembershipStatus } | null
      >,
      Trip.find({
        userId,
        "pendingEditors.0": { $exists: true },
      })
        .select("pendingEditors")
        .lean() as Promise<Array<{ pendingEditors: Array<unknown> }>>,
    ]);

    return {
      membershipStatus: user?.membershipStatus ?? "basic",
      notificationCount: ownedTrips.reduce(
        (count, trip) => count + trip.pendingEditors.length,
        0,
      ),
    };
  },
);
