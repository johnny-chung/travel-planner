import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithAuth0Action } from "@/features/auth/actions";
import { localizeHref } from "@/features/i18n/config";
import { getRequestDictionary } from "@/features/i18n/server";
import type { MarketingFeaturePage as MarketingFeaturePageContent } from "@/features/marketing/content";

type Props = {
  page: MarketingFeaturePageContent;
};

export default async function MarketingFeaturePage({ page }: Props) {
  const { locale, dictionary } = await getRequestDictionary();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(242,240,234,0.92)_100%)] px-4 py-16 dark:bg-[linear-gradient(180deg,rgba(31,28,25,0.96)_0%,rgba(24,22,20,0.98)_100%)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Link
              href={localizeHref(locale, "/")}
              className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80 hover:text-primary"
            >
              Roamer&apos;s Ledger
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <div className="mb-5">
                <Link
                  href={localizeHref(locale, "/")}
                  className="inline-flex items-center rounded-xl border border-border bg-card/90 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {dictionary.marketing.backHome}
                </Link>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/80">
                {page.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
                {page.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                {page.intro}
              </p>

              <ul className="mt-6 space-y-3">
                {page.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="rounded-xl border border-border/80 bg-card/90 px-4 py-3 text-sm leading-6 text-card-foreground shadow-sm"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={localizeHref(locale, "/try")}>
                  <Button className="h-12 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                    {dictionary.marketing.tryItOut}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <form action={signInWithAuth0Action}>
                  <input
                    type="hidden"
                    name="redirectTo"
                    value={localizeHref(locale, "/auth/post-login")}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-12 rounded-xl border-border bg-card/90 px-6 text-foreground hover:bg-muted"
                  >
                    {dictionary.marketing.signIn}
                  </Button>
                </form>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-border/80 bg-card/90 p-4 shadow-[0_18px_45px_rgba(48,62,60,0.10)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
              <div className="flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[1.2rem] bg-muted/60 p-4">
                {page.mediaType === "video" ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full rounded-[1rem] object-cover shadow-[0_20px_40px_rgba(41,58,57,0.18)] dark:shadow-[0_18px_36px_rgba(0,0,0,0.35)]"
                  >
                    <source src={page.mediaSrc} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={page.mediaSrc}
                    alt={page.mediaAlt}
                    width={520}
                    height={520}
                    className="h-full max-h-[22rem] w-[72%] object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
