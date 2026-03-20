import type { ReactNode } from "react";
import { createNoIndexMetadata } from "@/features/seo/metadata";

export const metadata = createNoIndexMetadata();

export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return children;
}

