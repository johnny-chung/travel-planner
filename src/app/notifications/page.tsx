import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <NotificationsClient />;
}