import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileClient from "@/features/profile/components/ProfileClient";
import { getRouteCallLimitForMembership } from "@/features/settings/service";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { UserMonthlyUsage } from "@/lib/models/UserMonthlyUsage";

function getYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findOne({ userId: session.user.id }).lean() as {
    membershipStatus?: string;
  } | null;
  const membershipStatus = user?.membershipStatus === "pro" ? "pro" : "basic";
  const [usage, routeLimit] = await Promise.all([
    UserMonthlyUsage.findOne({
      userId: session.user.id,
      yearMonth: getYearMonth(),
    }).lean() as Promise<{ commuteCount?: number } | null>,
    getRouteCallLimitForMembership(membershipStatus),
  ]);

  return (
    <ProfileClient
      user={{
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
        phone: session.user.phone ?? "",
        membershipStatus,
        routeUsageCount: usage?.commuteCount ?? 0,
        routeUsageLimit: membershipStatus === "pro" ? null : routeLimit,
      }}
    />
  );
}
