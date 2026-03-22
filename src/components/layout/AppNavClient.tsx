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
  UserPlus,
  Wallet,
} from "lucide-react";
import { signInWithAuth0Action, signOutAction } from "@/features/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/layout/BrandLogo";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";
import type { MembershipStatus } from "@/types/travel";
import {
  defaultLocale,
  localizeHref,
  removeLocaleFromPathname,
} from "@/features/i18n/config";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";

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

  const guestRouteMatch = pathname.match(/^\/try\/([^/]+)(?:\/plan)?/);
  if (guestRouteMatch) {
    return guestRouteMatch[1];
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
  const localizedPathname = pathname ?? `/${defaultLocale}`;
  const locale = getClientLocale(localizedPathname);
  const dictionary = getClientDictionary(localizedPathname);
  const cleanPathname = removeLocaleFromPathname(localizedPathname);
  const isGuestNav = !user && cleanPathname.startsWith("/try");
  const currentUser = user ?? { name: "", email: "", image: "" };
  const isPrintRoute = cleanPathname.endsWith("/plan/print");

  if ((!user && !isGuestNav) || cleanPathname === "/login" || isPrintRoute) {
    return null;
  }

  const initials =
    currentUser.name?.[0]?.toUpperCase() ??
    currentUser.email?.[0]?.toUpperCase() ??
    "U";
  const isDark = (resolvedTheme ?? "light") === "dark";
  const currentTripId = getTripIdFromPath(cleanPathname);

  function navHref(tab: "trips" | "plan" | "expense"): string {
    if (isGuestNav) {
      if (tab === "trips") {
        return localizeHref(locale, "/try");
      }

      if (tab === "plan" && currentTripId) {
        return localizeHref(locale, `/try/${currentTripId}/plan`);
      }

      return localizeHref(locale, "/try");
    }

    if (tab === "trips") {
      return localizeHref(locale, "/trips");
    }

    if (currentTripId) {
      return localizeHref(locale, `/trips/${currentTripId}/${tab}`);
    }

    return localizeHref(locale, tab === "plan" ? "/plans" : "/expense");
  }

  function isActive(tab: "trips" | "plan" | "expense" | "/"): boolean {
    if (isGuestNav) {
      if (tab === "/") {
        return cleanPathname === "/";
      }

      if (tab === "trips") {
        return cleanPathname === "/try" || /^\/try\/[^/]+$/.test(cleanPathname);
      }

      if (tab === "plan") {
        return /^\/try\/[^/]+\/plan$/.test(cleanPathname);
      }

      return false;
    }

    if (tab === "/") {
      return cleanPathname === "/";
    }

    if (tab === "trips") {
      return cleanPathname === "/trips" || /^\/trips\/[^/]+$/.test(cleanPathname);
    }

    if (tab === "plan") {
      return cleanPathname === "/plans" || cleanPathname === "/plan" || /\/plan$/.test(cleanPathname);
    }

    if (tab === "expense") {
      return cleanPathname === "/expense" || /\/expense$/.test(cleanPathname);
    }

    return cleanPathname === `/${tab}` || cleanPathname.startsWith(`/${tab}/`);
  }

  const navItems = [
    { tab: "/" as const, label: dictionary.common.home, icon: Home, href: localizeHref(locale, "/") },
    { tab: "trips" as const, label: dictionary.common.trips, icon: MapPin, href: navHref("trips") },
    { tab: "plan" as const, label: dictionary.common.plans, icon: Map, href: navHref("plan") },
  ];

  const userNavItems = [
    ...navItems,
    {
      tab: "expense" as const,
      label: dictionary.common.expenses,
      icon: Wallet,
      href: navHref("expense"),
    },
  ];

  const renderedNavItems = isGuestNav ? navItems : userNavItems;

  return (
    <>
      <header className="hidden md:flex fixed inset-x-0 top-0 z-50 h-16 bg-background/95 backdrop-blur border-b shadow-sm items-center px-6 gap-4">
        <Link
          href={localizeHref(locale, "/")}
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
          {renderedNavItems.map(({ tab, label, href }) => (
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
          <LanguageSwitcher variant="outline" className="h-10 px-3" />
          {isGuestNav ? (
            <form action={signInWithAuth0Action}>
              <input type="hidden" name="redirectTo" value={localizeHref(locale, "/auth/post-login")} />
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <UserPlus className="w-4 h-4" />
                {dictionary.common.signUp}
              </button>
            </form>
          ) : null}
          {!isGuestNav ? (
          <Link
            href={localizeHref(locale, "/notifications")}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label={dictionary.nav.notifications}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {notificationCount > 0 ? (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            ) : null}
          </Link>
          ) : null}
          {!isGuestNav ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none rounded-full ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500">
              <Avatar className="w-9 h-9 border-2 border-border cursor-pointer hover:opacity-80 transition">
                <AvatarImage src={currentUser.image} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="flex items-center justify-between gap-2 px-2 py-2 border-b mb-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {currentUser.name || currentUser.email}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full",
                    membershipStatus === "pro"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {membershipStatus === "pro"
                    ? dictionary.nav.membershipPro
                    : dictionary.nav.membershipBasic}
                </span>
              </div>
              <DropdownMenuItem
                onClick={() => router.push(localizeHref(locale, "/profile"))}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" /> {dictionary.common.profile}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? dictionary.nav.lightMode : dictionary.nav.darkMode}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-red-500 outline-hidden select-none hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" /> {dictionary.nav.signOut}
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : null}
        </div>
      </header>

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-card border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16">
          {renderedNavItems.map(({ tab, label, icon: Icon, href }) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
          {isGuestNav ? (
            <form action={signInWithAuth0Action} className="flex-1">
              <input type="hidden" name="redirectTo" value={localizeHref(locale, "/auth/post-login")} />
              <button
                type="submit"
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-primary"
              >
                <UserPlus className="w-5 h-5" />
                {dictionary.common.signUp}
              </button>
            </form>
          ) : null}
        </div>
      </nav>
    </>
  );
}
