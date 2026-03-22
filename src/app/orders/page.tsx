import { auth } from "@/auth";
import { redirect } from "next/navigation";

import OrdersPageClient from "@/features/orders/components/OrdersPageClient";
import { getOrdersForUser } from "@/features/orders/service";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orders = await getOrdersForUser(session.user.id);
  return <OrdersPageClient orders={orders} />;
}
