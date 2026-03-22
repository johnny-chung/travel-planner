import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingFeaturePage from "@/features/marketing/components/MarketingFeaturePage";
import {
  getMarketingFeatureMetadata,
  getMarketingFeaturePage,
} from "@/features/marketing/content";
import type { AppLocale } from "@/features/i18n/config";

type Props = {
  params: Promise<{ lang: AppLocale; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const page = getMarketingFeaturePage(slug, lang);

  if (!page) {
    return {};
  }

  return getMarketingFeatureMetadata(page, lang);
}

export default async function FeaturePage({ params }: Props) {
  const { lang, slug } = await params;
  const page = getMarketingFeaturePage(slug, lang);

  if (!page) {
    notFound();
  }

  return <MarketingFeaturePage page={page} />;
}
