import type { ReactNode } from "react";
import { createNoIndexMetadata } from "@/features/seo/metadata";

export const metadata = createNoIndexMetadata();

export default function PlansLayout({ children }: { children: ReactNode }) {
  return children;
}

