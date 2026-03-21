import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingFeaturePage from "@/features/marketing/components/MarketingFeaturePage";
import {
  getMarketingFeatureMetadata,
  getMarketingFeaturePage,
} from "@/features/marketing/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getMarketingFeaturePage(slug);

  if (!page) {
    return {};
  }

  return getMarketingFeatureMetadata(page);
}

export default async function FeaturePage({ params }: Props) {
  const { slug } = await params;
  const page = getMarketingFeaturePage(slug);

  if (!page) {
    notFound();
  }

  return <MarketingFeaturePage page={page} />;
}

