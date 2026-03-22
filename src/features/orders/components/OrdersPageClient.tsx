"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, BadgeDollarSign, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserOrder } from "@/features/orders/service";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { localizeHref } from "@/features/i18n/config";

type Props = {
  orders: UserOrder[];
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export default function OrdersPageClient({ orders }: Props) {
  const pathname = usePathname();
  const locale = getClientLocale(pathname);
  const dictionary = getClientDictionary(pathname);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pt-16">
      <section className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border/70 bg-[linear-gradient(135deg,#1c2421_0%,#2f6e62_58%,#5d7f76_100%)] shadow-[0_22px_55px_rgba(31,26,23,0.12)]">
          <div className="px-5 py-6 md:px-8">
            <div className="mb-4 flex items-center gap-3">
              <Link
                href={localizeHref(locale, "/profile")}
                className="rounded-lg bg-white/8 p-2 text-[#fff6ec] transition-colors hover:bg-white/12"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-[#d6e7de]">
                  {dictionary.orders.eyebrow}
                </p>
                <h1 className="text-xl font-bold text-[#fff6ec] md:text-2xl">
                  {dictionary.orders.title}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm text-[#dfe8e1]">
              {dictionary.orders.body}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-card px-5 py-10 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {dictionary.orders.emptyTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dictionary.orders.emptyBody}
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <article
                key={order._id}
                className="rounded-xl border border-border/70 bg-card px-4 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/70 text-primary">
                        <BadgeDollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {order.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dictionary.orders.orderPrefix} {order.orderNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-semibold text-foreground">
                      {formatMoney(order.amountCents, order.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderDate
                        ? format(new Date(order.orderDate), "MMM d, yyyy")
                        : dictionary.orders.unknownDate}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <Badge
                    variant="secondary"
                    className="bg-primary/12 text-primary hover:bg-primary/12"
                  >
                    {order.kind === "donation"
                      ? dictionary.orders.donation
                      : dictionary.orders.subscription}
                  </Badge>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
