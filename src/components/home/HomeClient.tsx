"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import {
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  Mail,
  Map,
  MapPin,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import BrandLogo from "@/components/branding/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Plan = {
  _id: string;
  name: string;
  description: string;
  centerName: string;
  centerLat: number | null;
  centerLng: number | null;
  createdAt: string;
};

type Props = {
  user: { name: string; email: string; image: string };
  plans: Plan[];
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
    <div className="min-h-screen bg-[#f5ead8] pb-16 md:pb-0 md:pt-16">
      <section
        className="px-2 pb-6 md:pt-4 md:px-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="mx-auto max-w-5xl overflow-hidden rounded-md border border-[#d7b48f]/60 bg-[linear-gradient(135deg,#6d4323_0%,#8b562d_55%,#a86835_100%)] shadow-[0_24px_70px_rgba(86,58,35,0.18)]">
          <div className="md:hidden border-b border-[#f2d4ac]/20 px-5 py-4 md:px-8">
            <div className="flex items-center justify-between">
              <BrandLogo
                size={40}
                priority
                iconClassName="h-10 w-10 rounded-2xl border border-[#d1a777]/50 bg-[#fff7ea] p-1.5"
                labelClassName="text-base text-[#fff3df]"
              />

              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger className="rounded-full outline-none">
                  <Avatar className="h-10 w-10 border-2 border-[#f2dcc0]/45">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="bg-[#fff7ea]/20 text-sm font-semibold text-[#fff6ec]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-72 flex-col p-0">
                  <SheetHeader className="bg-[linear-gradient(135deg,#6d4323_0%,#8b562d_100%)] px-5 pb-6 pt-8 text-white">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-16 w-16 border-2 border-[#f2dcc0]/45">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="bg-[#fff7ea]/20 text-xl font-semibold text-[#fff6ec]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <SheetTitle className="text-base font-bold text-white">
                          {user.name || "User"}
                        </SheetTitle>
                        <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-[#f3ddbf]">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            membershipStatus === "pro"
                              ? "bg-[#ebb06e]/25 text-[#fff1d9]"
                              : "bg-[#fff7ea]/16 text-[#fff1d9]/80"
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1dfc5]">
                        <User className="h-5 w-5 text-[#ab6534]" />
                      </div>
                      <span className="font-medium text-foreground">Profile</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60" />
                    </button>

                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-muted"
                      onClick={() => setTheme(isDark ? "light" : "dark")}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1dfc5]">
                        {isDark ? (
                          <Sun className="h-5 w-5 text-[#ab6534]" />
                        ) : (
                          <Moon className="h-5 w-5 text-[#ab6534]" />
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1dfc5]">
                        <Bell className="h-5 w-5 text-[#ab6534]" />
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

          <div className="grid gap-8 px-5 py-7 md:px-8 lg:grid-cols-[minmax(0,1.08fr)_19rem] lg:items-end">
            <div>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-[#f1c48f]">
                Member Home
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#fff6ec] md:text-4xl">
                Hello, {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f3ddbf] md:text-base">
                Reopen the journal, find your last routes, and pick up the next
                trip.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] border border-[#e7c49e]/35 bg-[#fff7ea]/12 p-4 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-[#fff6ec]">{plans.length}</p>
                  <p className="mt-0.5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[#f3ddbf]">
                    Trips
                  </p>
                </div>
                <Link
                  href="/donate"
                  className="rounded-[1.5rem] border border-[#e7c49e]/35 bg-[#fff7ea]/12 p-4 transition-colors hover:bg-[#fff7ea]/20"
                >
                  <Heart className="h-6 w-6 text-[#fff1d9] fill-red-600" />
                  <p className="mt-2 text-sm text-[#f3ddbf]">Support us</p>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-[1.8rem] border border-[#e7c49e]/35 bg-[#fff7ea]/10 p-4 backdrop-blur-sm">
                <Image
                  src="/material/Compass_Map.png"
                  alt="Compass and map"
                  width={360}
                  height={260}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-5xl">
          {recentPlans.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#4a3223]">
                  Recent Trips
                </h2>
                <Link
                  href="/trips"
                  className="flex items-center gap-1 text-md font-medium text-[#9d6030] hover:underline"
                >
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recentPlans.map((plan) => (
                  <div
                    key={plan._id}
                    onClick={() => router.push(`/trips/${plan._id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-[1.7rem] border border-[#d9b58c]/60 bg-[#fff9f0] p-4 shadow-[0_18px_45px_rgba(86,58,35,0.08)] transition-transform hover:shadow-[0_22px_55px_rgba(86,58,35,0.12)] active:scale-[0.98]"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1dfc5]">
                      <Map className="h-5 w-5 text-[#ab6534]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-[#4a3223]">
                        {plan.name}
                      </h3>
                      {plan.centerName ? (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#6f5138]">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {plan.centerName}
                        </p>
                      ) : plan.description ? (
                        <p className="mt-0.5 truncate text-xs text-[#6f5138]">
                          {plan.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-[#8f6d52]">
                        {format(new Date(plan.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#8f6d52]" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f1dfc5]">
                <Map className="h-10 w-10 text-[#ab6534]" />
              </div>
              <h3 className="text-lg font-semibold text-[#4a3223]">
                No plans yet
              </h3>
              <p className="mt-1 text-sm text-[#6f5138]">
                Go to{" "}
                <Link
                  href="/trips"
                  className="font-medium text-[#9d6030] hover:underline"
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
