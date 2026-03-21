"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  Mail,
  Map,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import BrandLogo from "@/components/layout/BrandLogo";
import TripCardGrid from "@/features/trips/components/list/TripCardGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { TripSummary } from "@/types/travel";

type Props = {
  user: { name: string; email: string; image: string };
  plans: TripSummary[];
  membershipStatus: "basic" | "pro";
};

export default function HomeClient({ user, plans, membershipStatus }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDark = (resolvedTheme ?? "light") === "dark";
  const firstName = user.name?.split(" ")[0] ?? "there";
  const recentPlans = plans.slice(0, 3);
  const initials =
    user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pt-16">
      <section
        className="px-2 pb-6 md:pt-4 md:px-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border/70 shadow-[0_22px_55px_rgba(31,26,23,0.12)]">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/material/carousell.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(28,36,33,0.98)_0%,rgba(47,110,98,0.95)_58%,rgba(93,127,118,0.98)_100%)]" />
          <div className="md:hidden border-b border-white/12 px-5 py-4 md:px-8">
            <div className="relative z-10 flex items-center justify-between">
              <BrandLogo
                size={40}
                priority
                iconClassName="h-10 w-10 rounded-xl border border-white/15 bg-white/8 p-1.5"
                labelClassName="text-base text-[#f7efe2]"
              />

              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger className="rounded-full outline-none">
                  <Avatar className="h-10 w-10 border border-white/20">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="bg-white/10 text-sm font-semibold text-[#fff6ec]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-72 flex-col p-0">
                  <SheetHeader className="bg-[linear-gradient(135deg,#1c2421_0%,#2f6e62_100%)] px-5 pb-6 pt-8 text-white">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-16 w-16 border border-white/20">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="bg-white/10 text-xl font-semibold text-[#fff6ec]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <SheetTitle className="text-base font-bold text-white">
                          {user.name || "User"}
                        </SheetTitle>
                        <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-[#d8e6df]">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            membershipStatus === "pro"
                              ? "bg-[#c98b52]/20 text-[#fbf2e5]"
                              : "bg-white/10 text-[#f1ebe0]/85"
                          }`}
                        >
                          {membershipStatus === "pro" ? "PRO" : "BASIC"}
                        </span>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 space-y-2 px-4 py-4">
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-muted"
                      onClick={() => {
                        setSheetOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/70">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        Profile
                      </span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60" />
                    </button>

                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-muted"
                      onClick={() => setTheme(isDark ? "light" : "dark")}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/70">
                        {isDark ? (
                          <Sun className="h-5 w-5 text-primary" />
                        ) : (
                          <Moon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">
                        {isDark ? "Light Mode" : "Dark Mode"}
                      </span>
                    </button>

                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-muted"
                      onClick={() => {
                        setSheetOpen(false);
                        router.push("/notifications");
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/70">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        Notifications
                      </span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60" />
                    </button>
                  </div>

                  <div className="px-4 pb-8">
                    <form action={signOutAction}>
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-12 w-full rounded-2xl gap-2 border-red-200 font-semibold text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </form>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="relative z-10 grid gap-8 px-5 py-7 md:px-8 lg:grid-cols-[minmax(0,1.08fr)_19rem] lg:items-end">
            <div>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-[#d6e7de]">
                Member Home
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#fff6ec] md:text-4xl">
                Hello, {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#deeadf] md:text-base">
                Reopen the journal, find your last routes, and pick up the next
                trip.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/14 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-[#fff6ec]">
                    {plans.length}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[#deeadf]">
                    Trips
                  </p>
                </div>
                <Link
                  href="/donate"
                  className="rounded-lg border border-white/14 bg-white/8 p-4 transition-colors hover:bg-white/12"
                >
                  <Heart className="h-6 w-6 text-[#fff1d9] fill-red-600" />
                  <p className="mt-2 text-sm text-[#deeadf]">Support us</p>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <Image
                src="/material/Cat_and_Bag.png"
                alt="Compass and map"
                width={360}
                height={260}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-5xl">
          {recentPlans.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  Recent Trips
                </h2>
                <Link
                  href="/trips"
                  className="flex items-center gap-1 text-md font-medium text-primary hover:underline"
                >
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <TripCardGrid trips={recentPlans} canShareCode={false} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-accent">
                <Map className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No Trips yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Go to{" "}
                <Link
                  href="/trips"
                  className="font-medium text-primary hover:underline"
                >
                  Trips
                </Link>{" "}
                to create your first trip
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
