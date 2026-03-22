import type { Metadata } from "next";

import { createNoIndexMetadata } from "@/features/seo/metadata";

export const metadata: Metadata = createNoIndexMetadata();

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
