"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Props = { currentStatus: string };

export default function UpgradeClient({ currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const isPro = currentStatus === "pro";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="font-brand text-2xl font-bold text-foreground">
            Roamer&apos;s Ledger Pro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is jsut a personal project and API call ain&apos;t free. You
            subscription help me pay the bill.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unlock the full Roamer&apos;s Ledger experience
          </p>
        </div>

        <div className="mb-4 rounded-[1.4rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground">$5</span>
            <span className="text-sm text-muted-foreground">/year</span>
            <Badge className="ml-1 bg-accent/70 text-accent-foreground hover:bg-accent/70 text-xs">
              50% off
            </Badge>
          </div>
          <p className="mb-5 text-xs text-muted-foreground line-through">
            Regular price $10/year
          </p>

          <ul className="space-y-3 mb-6">
            {[
              "Unlimited active trips",
              "Unlimited trip collaborators",
              "Unlimited navigation uses",
              "Priority support",
            ].map((feature) => (
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
              <Check className="w-4 h-4" /> You&apos;re already a Pro member!
            </div>
          ) : (
            <Button
              className="h-12 w-full rounded-xl bg-primary font-semibold text-base text-primary-foreground hover:bg-primary/90"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Redirecting..." : "Upgrade Now"}
            </Button>
          )}
        </div>

        {!isPro && (
          <>
            <p className="text-center text-xs text-muted-foreground">
              Already subscribed? Send me an email.
            </p>
            <a
              href="mailto:johnny@goodmanltd.com"
              className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Support
            </a>
          </>
        )}
      </div>
    </div>
  );
}
