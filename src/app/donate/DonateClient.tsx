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
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-8 text-white text-center">
        <Link href="/" className="absolute top-5 left-4 p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>
        <h1 className="text-2xl font-bold">Support Roamer&apos;s Ledger</h1>
        <p className="text-blue-100 text-sm mt-2 max-w-xs mx-auto">
          Your contribution helps keep Roamer&apos;s Ledger free and growing. Every bit counts!
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-card rounded-t-3xl px-6 pt-8 pb-10 max-w-lg mx-auto w-full">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground">Thank you so much! ❤️</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Your generosity means the world to us and helps us keep improving Roamer&apos;s Ledger.
            </p>
            <Link href="/" className="mt-6">
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 font-semibold">Back to Home</Button>
            </Link>
          </div>
        ) : canceled ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="w-14 h-14 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground">Donation canceled</h2>
            <p className="text-muted-foreground text-sm mt-2">No worries — you can donate any time.</p>
            <Button
              className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 font-semibold"
              onClick={() => window.history.replaceState({}, "", "/donate")}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-foreground mb-4">Choose an amount</h2>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={`rounded-2xl py-3 text-sm font-bold border-2 transition-colors ${
                    amount === String(p)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-card border-border text-foreground hover:border-blue-400"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-8 rounded-2xl h-12 text-sm font-medium focus-visible:ring-blue-500"
                placeholder="Other amount"
              />
            </div>
            <p className="text-xs text-muted-foreground mb-6">Minimum $1.00 · Processed securely by Stripe</p>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <Button
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base gap-2 h-12"
              onClick={handleDonate}
              disabled={!isValid || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
              {loading ? "Redirecting…" : `Donate $${isValid ? numericAmount.toFixed(2) : "–"}`}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              One-time payment · No account required
            </p>
          </>
        )}
      </div>
    </div>
  );
}
