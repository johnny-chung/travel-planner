import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRequestDictionary } from "@/features/i18n/server";
import { localizeHref } from "@/features/i18n/config";
import { buildAbsoluteUrl, buildLocaleAlternates } from "@/features/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary, locale } = await getRequestDictionary();

  return {
    title: dictionary.privacyPage.title,
    description: dictionary.privacyPage.description,
    alternates: buildLocaleAlternates(locale, "/privacy"),
    openGraph: {
      title: dictionary.privacyPage.title,
      description: dictionary.privacyPage.description,
      url: buildAbsoluteUrl(localizeHref(locale, "/privacy")),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.privacyPage.title,
      description: dictionary.privacyPage.description,
    },
  };
}

export default async function PrivacyPage() {
  const { dictionary, locale } = await getRequestDictionary();
  const sections = [
    {
      title: dictionary.privacyPage.sectionStorageTitle,
      body: dictionary.privacyPage.sectionStorageBody,
    },
    {
      title: dictionary.privacyPage.sectionAccountTitle,
      body: dictionary.privacyPage.sectionAccountBody,
    },
    {
      title: dictionary.privacyPage.sectionLocationTitle,
      body: dictionary.privacyPage.sectionLocationBody,
    },
    {
      title: dictionary.privacyPage.sectionPaymentsTitle,
      body: dictionary.privacyPage.sectionPaymentsBody,
    },
    {
      title: dictionary.privacyPage.sectionOfflineTitle,
      body: dictionary.privacyPage.sectionOfflineBody,
    },
    {
      title: dictionary.privacyPage.sectionSharingTitle,
      body: dictionary.privacyPage.sectionSharingBody,
    },
    {
      title: dictionary.privacyPage.sectionContactTitle,
      body: dictionary.privacyPage.sectionContactBody,
    },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={localizeHref(locale, "/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {dictionary.privacyPage.back}
        </Link>

        <section className="mt-6 overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(242,240,234,0.9)_100%)] px-6 py-8 dark:bg-[linear-gradient(180deg,rgba(31,28,25,0.96)_0%,rgba(24,22,20,0.98)_100%)]">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/80">
              {dictionary.privacyPage.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              {dictionary.privacyPage.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {dictionary.privacyPage.description}
            </p>
          </div>

          <div className="space-y-6 px-6 py-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
