import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DonateClient from "@/features/donate/components/DonateClient";
import { localizeHref, type AppLocale } from "@/features/i18n/config";

type Props = {
  searchParams: Promise<{ success?: string; canceled?: string }>;
  params: Promise<{ lang: AppLocale }>;
};

export default async function DonatePage({ searchParams, params }: Props) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(localizeHref(lang, "/login"));

  const { success, canceled } = await searchParams;
  return <DonateClient success={!!success} canceled={!!canceled} />;
}
