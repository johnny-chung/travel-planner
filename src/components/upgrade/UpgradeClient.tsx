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
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Roamer&apos;s Ledger Pro</h1>
          <p className="text-gray-500 mt-1 text-sm">Unlock the full Roamer&apos;s Ledger experience</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-gray-900">$5</span>
            <span className="text-gray-400 text-sm">/year</span>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs ml-1">50% off</Badge>
          </div>
          <p className="text-gray-400 text-xs mb-5 line-through">Regular price $10/year</p>

          <ul className="space-y-3 mb-6">
            {[
              "Unlimited active trips",
              "Unlimited trip collaborators",
              "Unlimited navigation uses",
              "Priority support",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-blue-600" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="w-full h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-green-700 font-semibold">
              <Check className="w-4 h-4" /> You&apos;re already a Pro member!
            </div>
          ) : (
            <Button
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-semibold text-base"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Redirecting..." : "Upgrade Now"}
            </Button>
          )}
        </div>

        {!isPro && (
          <p className="text-center text-xs text-gray-400">
            Already subscribed? Your Pro status will be restored automatically.
          </p>
        )}
      </div>
    </div>
  );
}
