import { auth } from "@/auth";
import { redirect } from "next/navigation";

import OrdersPageClient from "@/features/orders/components/OrdersPageClient";
import { getOrdersForUser } from "@/features/orders/service";
import { localizeHref, type AppLocale } from "@/features/i18n/config";

type Props = { params: Promise<{ lang: AppLocale }> };

export default async function OrdersPage({ params }: Props) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(localizeHref(lang, "/login"));
  }

  const orders = await getOrdersForUser(session.user.id);
  return <OrdersPageClient orders={orders} />;
}
