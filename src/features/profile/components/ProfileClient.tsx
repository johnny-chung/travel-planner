"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  LogOut,
  Mail,
  Navigation,
  Phone,
  User,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    phone: string;
    membershipStatus: string;
    routeUsageCount: number;
    routeUsageLimit: number | null;
  };
};

export default function ProfileClient({ user }: Props) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "U";

  const monthlyUsage =
    user.routeUsageLimit === null
      ? "Unlimited"
      : `${user.routeUsageCount} / ${user.routeUsageLimit}`;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pt-16">
      <section className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border/70 bg-[linear-gradient(135deg,#1c2421_0%,#2f6e62_58%,#5d7f76_100%)] shadow-[0_22px_55px_rgba(31,26,23,0.12)]">
          <div className="grid gap-8 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-white/8 p-2 text-[#fff6ec] transition-colors hover:bg-white/12"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-[#d6e7de]">
                    Profile
                  </p>
                  <h1 className="text-xl font-bold text-[#fff6ec] md:text-2xl">
                    Member Details
                  </h1>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                <Avatar className="h-24 w-24 border border-white/18 shadow-xl">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="bg-white/10 text-2xl font-bold text-[#fff6ec]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-[#fff6ec]">
                    {user.name || "Unknown user"}
                  </h2>
                  <p className="mt-1 text-sm text-[#dfe8e1]">{user.email}</p>
                  <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                    {user.membershipStatus === "pro" ? (
                        <Badge className="bg-[#c98b52]/20 text-[#fff1d9] hover:bg-[#c98b52]/20">
                        Pro
                      </Badge>
                    ) : (
                        <Badge className="bg-white/10 text-[#fff1d9]/80 hover:bg-white/10">
                        Basic
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-lg border border-white/14 bg-white/8 p-4 backdrop-blur-sm">
                <Image
                  src="/material/Notebook.png"
                  alt="Notebook illustration"
                  width={320}
                  height={280}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoRow
              icon={<User className="h-5 w-5 text-[#ab6534]" />}
              label="Full Name"
              value={user.name || "—"}
            />
            <InfoRow
              icon={<Mail className="h-5 w-5 text-[#ab6534]" />}
              label="Email"
              value={user.email || "—"}
            />
            {user.phone ? (
              <InfoRow
                icon={<Phone className="h-5 w-5 text-[#ab6534]" />}
                label="Phone"
                value={user.phone}
              />
            ) : null}
            <div className="rounded-lg border border-border/70 bg-card px-4 py-3 shadow-sm">
              <p className="mb-0.5 text-xs text-muted-foreground">Account ID</p>
              <p className="truncate font-mono text-sm text-foreground">{user.id}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/70">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Membership</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {user.membershipStatus === "pro" ? (
                        <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                        Pro
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-accent/80 text-primary"
                      >
                        Basic
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {user.membershipStatus !== "pro" ? (
                <Link href="/upgrade">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Upgrade to Pro
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
              <Navigation className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                Route calculations this month: <strong>{monthlyUsage}</strong>
              </span>
            </div>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full rounded-lg gap-2 border-red-200 font-semibold text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/70">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
