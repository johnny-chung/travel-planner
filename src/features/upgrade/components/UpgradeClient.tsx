"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { localizeHref } from "@/features/i18n/config";

type Props = { currentStatus: string };

export default function UpgradeClient({ currentStatus }: Props) {
  const pathname = usePathname();
  const locale = getClientLocale(pathname);
  const dictionary = getClientDictionary(pathname);
  const [loading, setLoading] = useState(false);
  const isPro = currentStatus === "pro";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dictionary.upgrade.checkoutError);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : dictionary.upgrade.checkoutError,
      );
    } finally {
      setLoading(false);
    }
  }

  const features = [
    dictionary.upgrade.feature1,
    dictionary.upgrade.feature2,
    dictionary.upgrade.feature3,
    dictionary.upgrade.feature4,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(91,143,137,0.18),transparent_32%),linear-gradient(180deg,rgba(246,244,239,1)_0%,rgba(236,231,224,1)_100%)] px-4 py-16 dark:bg-[radial-gradient(circle_at_top,rgba(91,143,137,0.18),transparent_26%),linear-gradient(180deg,rgba(28,24,22,1)_0%,rgba(20,18,16,1)_100%)]">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href={localizeHref(locale, "/")}
          className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> {dictionary.upgrade.back}
        </Link>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="font-brand text-2xl font-bold text-foreground">
            {dictionary.upgrade.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dictionary.upgrade.body1}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {dictionary.upgrade.body2}
          </p>
        </div>

        <div className="mb-4 rounded-[1.4rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">$5</span>
            <span className="text-sm text-muted-foreground">
              {dictionary.upgrade.priceSuffix}
            </span>
            <Badge className="ml-1 bg-accent/70 text-xs text-accent-foreground hover:bg-accent/70">
              {dictionary.upgrade.discount}
            </Badge>
          </div>
          <p className="mb-5 text-xs text-muted-foreground line-through">
            {dictionary.upgrade.regularPrice}
          </p>

          <ul className="mb-6 space-y-3">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 text-sm text-foreground"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Check className="w-3 h-3" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 font-semibold text-primary">
              <Check className="w-4 h-4" /> {dictionary.upgrade.alreadyPro}
            </div>
          ) : (
            <Button
              className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading
                ? dictionary.upgrade.redirecting
                : dictionary.upgrade.upgradeNow}
            </Button>
          )}
        </div>

        {!isPro ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-xs text-muted-foreground">
              {dictionary.upgrade.supportPrompt}
            </p>
            <a
              href="mailto:johnny@goodmanltd.com"
              className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {dictionary.common.support}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
