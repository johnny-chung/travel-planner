"use client";

import { useState } from "react";
import { Heart, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const PRESETS = [3, 5, 10, 20];

type Props = { success?: boolean; canceled?: boolean };

export default function DonateClient({ success, canceled }: Props) {
  const [amount, setAmount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericAmount = parseFloat(amount);
  const isValid = !isNaN(numericAmount) && numericAmount >= 1;

  async function handleDonate() {
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(91,143,137,0.18),transparent_32%),linear-gradient(180deg,rgba(246,244,239,1)_0%,rgba(236,231,224,1)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(91,143,137,0.18),transparent_26%),linear-gradient(180deg,rgba(28,24,22,1)_0%,rgba(20,18,16,1)_100%)]">
      <div className="px-4 pb-8 pt-24 text-foreground">
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="mb-6 inline-flex rounded-xl border border-border/70 bg-card/80 p-2 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-card/80 shadow-sm">
              <Heart className="w-8 h-8 fill-red-500 text-red-700" />
            </div>
            <h1 className="text-2xl font-bold">Support Roamer&apos;s Ledger</h1>
            <p className="my-2 text-sm text-muted-foreground">
              This is a personal project, and the APIs behind maps, route calculation,
              and suggestions are not free to run.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              Your contribution helps keep Roamer&apos;s Ledger free and growing.
              Every bit counts.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col rounded-t-[1.6rem] border border-border/70 bg-card px-6 pb-10 pt-8 shadow-[0_-18px_45px_rgba(47,67,65,0.08)]">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground">Thank you so much! ❤️</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Your generosity means the world to us and helps us keep improving Roamer&apos;s Ledger.
            </p>
            <Link href="/" className="mt-6">
              <Button className="h-11 rounded-xl bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">Back to Home</Button>
            </Link>
          </div>
        ) : canceled ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="w-14 h-14 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground">Donation canceled</h2>
            <p className="text-muted-foreground text-sm mt-2">No worries — you can donate any time.</p>
            <Button
              className="mt-6 h-11 rounded-xl bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => window.history.replaceState({}, "", "/donate")}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-base font-semibold text-foreground">Choose an amount (CAD)</h2>

            <div className="mb-5 grid grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={`rounded-2xl py-3 text-sm font-bold border-2 transition-colors ${
                    amount === String(p)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>

            <div className="relative mb-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="h-12 rounded-2xl pl-8 text-sm font-medium focus-visible:ring-primary"
                placeholder="Other amount"
              />
            </div>
            <p className="mb-6 text-xs text-muted-foreground">Minimum $1.00 · Processed securely by Stripe</p>

            {error ? <p className="mb-4 text-center text-sm text-red-500">{error}</p> : null}

            <Button
              className="h-12 w-full gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
              onClick={handleDonate}
              disabled={!isValid || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
              {loading ? "Redirecting…" : `Donate $${isValid ? numericAmount.toFixed(2) : "–"}`}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              One-time payment · No account required
            </p>
          </>
        )}
      </div>
    </div>
  );
}
