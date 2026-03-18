"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { MapPin, Map, ChevronRight, Heart, User, LogOut, Mail, Sun, Moon, Bell } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { signOut } from "next-auth/react";
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
  googleMapsApiKey: string;
  membershipStatus: "basic" | "pro";
};

export default function HomeClient({ user, plans, googleMapsApiKey: _, membershipStatus }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDark = theme === "dark";
  const firstName = user.name?.split(" ")[0] ?? "there";
  const recentPlans = plans.slice(0, 3);
  const initials =
    user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0 md:pt-16">
      {/* Blue hero */}
      <div className="bg-blue-600 text-white px-5 pb-8 md:pt-10 shadow-lg"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}>
        <div className="max-w-4xl mx-auto">
          {/* Mobile header row */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg">Roamer's Ledger</span>
            </div>

            {/* Avatar triggers side sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="outline-none rounded-full">
                <Avatar className="w-9 h-9 border-2 border-white/40">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="bg-white/30 text-white text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 flex flex-col">
                <SheetHeader className="bg-blue-600 text-white px-5 pt-8 pb-6">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="w-16 h-16 border-2 border-white/40">
                      <AvatarImage src={user.image} />
                      <AvatarFallback className="bg-white/30 text-white text-xl font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <SheetTitle className="text-white font-bold text-base">
                        {user.name || "User"}
                      </SheetTitle>
                      <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1 justify-center">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                      <span className={`mt-2 inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        membershipStatus === "pro"
                          ? "bg-amber-400/30 text-amber-200"
                          : "bg-white/20 text-white/70"
                      }`}>
                        {membershipStatus === "pro" ? "✦ PRO" : "BASIC"}
                      </span>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 px-4 py-4 space-y-2">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted transition-colors text-left"
                    onClick={() => { setSheetOpen(false); router.push("/profile"); }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Profile</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 ml-auto" />
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted transition-colors text-left"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      {isDark
                        ? <Sun className="w-5 h-5 text-primary" />
                        : <Moon className="w-5 h-5 text-primary" />}
                    </div>
                    <span className="font-medium text-foreground">
                      {isDark ? "Light Mode" : "Dark Mode"}
                    </span>
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted transition-colors text-left"
                    onClick={() => { setSheetOpen(false); router.push("/notifications"); }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Notifications</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 ml-auto" />
                  </button>
                </div>

                <div className="px-4 pb-8">
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl text-red-500 border-red-200 hover:bg-red-50 gap-2 font-semibold"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <h1 className="text-2xl font-bold">Hello, {firstName} &#128075;</h1>
          <p className="text-blue-100 text-sm mt-1">Ready to plan your next adventure?</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-2xl p-4">
              <p className="text-3xl font-bold">{plans.length}</p>
              <p className="text-blue-100 text-sm mt-0.5">Trips</p>
            </div>
            <Link href="/donate" className="bg-white/15 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/25 transition-colors">
              <Heart className="w-6 h-6 text-white/70" />
              <p className="text-blue-100 text-sm mt-2">Support us</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {recentPlans.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground text-base">Recent Trips</h2>
              <Link
                href="/trips"
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentPlans.map((plan) => (
                <div
                  key={plan._id}
                  onClick={() => router.push(`/trips/${plan._id}`)}
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Map className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm">{plan.name}</h3>
                    {plan.centerName ? (
                      <p className="text-muted-foreground text-xs truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {plan.centerName}
                      </p>
                    ) : plan.description ? (
                      <p className="text-muted-foreground text-xs truncate mt-0.5">{plan.description}</p>
                    ) : null}
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      {format(new Date(plan.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Map className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">No plans yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Go to{" "}
              <Link href="/trips" className="text-blue-600 font-medium hover:underline">
                Trips
              </Link>{" "}
              to create your first trip
            </p>
          </div>
        )}
      </div>
    </div>
  );
}