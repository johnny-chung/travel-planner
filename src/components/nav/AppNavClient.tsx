"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Home,
  LogOut,
  Map,
  MapPin,
  Moon,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/branding/BrandLogo";
import { cn } from "@/lib/utils";
import type { MembershipStatus } from "@/types/travel";

type Props = {
  user: {
    name: string;
    email: string;
    image: string;
  } | null;
  membershipStatus: MembershipStatus;
  notificationCount: number;
};

function getTripIdFromPath(pathname: string): string | null {
  const tripRouteMatch = pathname.match(/^\/trips\/([^/]+)(?:\/(plan|expense))?/);
  if (tripRouteMatch) {
    return tripRouteMatch[1];
  }

  const legacyRouteMatch = pathname.match(/^\/(plan|expense)\/([^/]+)/);
  return legacyRouteMatch ? legacyRouteMatch[2] : null;
}

export default function AppNavClient({
  user,
  membershipStatus,
  notificationCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  if (!user || pathname === "/login") {
    return null;
  }

  const initials =
    user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U";
  const isDark = (resolvedTheme ?? "light") === "dark";
  const currentTripId = getTripIdFromPath(pathname);

  function navHref(tab: "trips" | "plan" | "expense"): string {
    if (tab === "trips") {
      return "/trips";
    }

    if (currentTripId) {
      return `/trips/${currentTripId}/${tab}`;
    }

    return tab === "plan" ? "/plans" : "/expense";
  }

  function isActive(tab: "trips" | "plan" | "expense" | "/"): boolean {
    if (tab === "/") {
      return pathname === "/";
    }

    if (tab === "trips") {
      return pathname === "/trips" || /^\/trips\/[^/]+$/.test(pathname);
    }

    if (tab === "plan") {
      return pathname === "/plans" || pathname === "/plan" || /\/plan$/.test(pathname);
    }

    if (tab === "expense") {
      return pathname === "/expense" || /\/expense$/.test(pathname);
    }

    return pathname === `/${tab}` || pathname.startsWith(`/${tab}/`);
  }

  const navItems = [
    { tab: "/" as const, label: "Home", icon: Home, href: "/" },
    { tab: "trips" as const, label: "Trips", icon: MapPin, href: navHref("trips") },
    { tab: "plan" as const, label: "Plans", icon: Map, href: navHref("plan") },
    {
      tab: "expense" as const,
      label: "Expenses",
      icon: Wallet,
      href: navHref("expense"),
    },
  ];

  return (
    <>
      <header className="hidden md:flex fixed inset-x-0 top-0 z-50 h-16 bg-background/95 backdrop-blur border-b shadow-sm items-center px-6 gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-primary text-lg mr-6 shrink-0"
        >
          <BrandLogo
            size={32}
            priority
            iconClassName="h-8 w-8"
            labelClassName="text-lg text-primary"
          />
        </Link>
        <nav className="flex-1 flex items-center justify-center gap-1">
          {navItems.map(({ tab, label, href }) => (
            <Link
              key={tab}
              href={href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(tab)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {notificationCount > 0 ? (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            ) : null}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none rounded-full ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500">
              <Avatar className="w-9 h-9 border-2 border-border cursor-pointer hover:opacity-80 transition">
                <AvatarImage src={user.image} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="flex items-center justify-between gap-2 px-2 py-2 border-b mb-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {user.name || user.email}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full",
                    membershipStatus === "pro"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {membershipStatus === "pro" ? "PRO" : "BASIC"}
                </span>
              </div>
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-red-500 outline-hidden select-none hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-card border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16">
          {navItems.map(({ tab, label, icon: Icon, href }) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-blue-600" : "text-gray-400",
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
