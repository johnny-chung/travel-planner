import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DonateClient from "./DonateClient";

type Props = { searchParams: Promise<{ success?: string; canceled?: string }> };

export default async function DonatePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { success, canceled } = await searchParams;
  return <DonateClient success={!!success} canceled={!!canceled} />;
}
