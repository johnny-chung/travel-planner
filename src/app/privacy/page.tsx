import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Roamer's Ledger.",
};

const sections = [
  {
    title: "What this app stores",
    body: "Roamer's Ledger stores the trip information you create, such as trip names, itinerary items, transport, stays, checklist items, expenses, and account-linked settings needed to run the planner.",
  },
  {
    title: "Account information",
    body: "When you sign in, the app receives basic account information from the authentication provider, such as your name, email address, and profile image, so your account and trip sharing features can work.",
  },
  {
    title: "Location and map data",
    body: "When you search for places, routes, or map suggestions, the app sends those requests to third-party mapping providers such as Google Maps Platform and Geoapify. Those providers may process request data according to their own policies.",
  },
  {
    title: "Payments",
    body: "If you subscribe or donate, payment processing is handled by Stripe. Roamer's Ledger does not store full card details on its own servers.",
  },
  {
    title: "Offline and exported content",
    body: "If you export trip content or save copies for offline use on your device, those copies are under your control on that device and may remain available until you delete them.",
  },
  {
    title: "Sharing and collaboration",
    body: "If you share a trip or invite collaborators, the people you add may be able to view and interact with the trip data you share with them, depending on their access level.",
  },
  {
    title: "Contact",
    body: "For privacy questions, use the support link in the footer to contact the project owner.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <section className="mt-6 overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(242,240,234,0.9)_100%)] px-6 py-8 dark:bg-[linear-gradient(180deg,rgba(31,28,25,0.96)_0%,rgba(24,22,20,0.98)_100%)]">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/80">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              This page explains, in plain language, what data the app uses so the
              planner can work. Last updated: March 21, 2026.
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
