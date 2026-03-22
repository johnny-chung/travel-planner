import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UpgradeClient from "@/features/upgrade/components/UpgradeClient";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { localizeHref, type AppLocale } from "@/features/i18n/config";

type Props = { params: Promise<{ lang: AppLocale }> };

export default async function UpgradePage({ params }: Props) {
  const { lang } = await params;
  const session = await auth();
  if (!session) redirect(localizeHref(lang, "/login"));

  await connectDB();
  const user = await User.findOne({ userId: session.user?.id }).lean() as { membershipStatus?: string } | null;
  const membershipStatus = user?.membershipStatus ?? "basic";

  return <UpgradeClient currentStatus={membershipStatus} />;
}
