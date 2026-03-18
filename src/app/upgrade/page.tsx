import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UpgradeClient from "@/components/upgrade/UpgradeClient";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export default async function UpgradePage() {
  const session = await auth();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findOne({ userId: session.user?.id }).lean() as { membershipStatus?: string } | null;
  const membershipStatus = user?.membershipStatus ?? "basic";

  return <UpgradeClient currentStatus={membershipStatus} />;
}
