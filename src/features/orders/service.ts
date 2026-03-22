import "server-only";

import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";

export type UserOrder = {
  _id: string;
  orderNumber: string;
  kind: "subscription" | "donation";
  title: string;
  amountCents: number;
  currency: string;
  orderDate: string;
};

type RawOrder = {
  _id: unknown;
  orderNumber?: string;
  kind?: "subscription" | "donation";
  title?: string;
  amountCents?: number;
  currency?: string;
  orderDate?: Date;
};

function serializeOrder(order: RawOrder): UserOrder {
  return {
    _id: String(order._id),
    orderNumber: order.orderNumber ?? "",
    kind: order.kind === "donation" ? "donation" : "subscription",
    title: order.title ?? "",
    amountCents: order.amountCents ?? 0,
    currency: (order.currency ?? "usd").toUpperCase(),
    orderDate: order.orderDate ? new Date(order.orderDate).toISOString() : "",
  };
}

export async function getOrdersForUser(userId: string) {
  await connectDB();

  const orders = (await Order.find({ userId })
    .sort({ orderDate: -1, createdAt: -1 })
    .lean()) as RawOrder[];

  return orders.map(serializeOrder);
}
