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
    <div className="min-h-screen bg-[#f5ead8] pb-16 md:pb-0 md:pt-16">
      <section className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border border-[#d7b48f]/60 bg-[linear-gradient(135deg,#6d4323_0%,#8b562d_55%,#a86835_100%)] shadow-[0_24px_70px_rgba(86,58,35,0.18)]">
          <div className="grid gap-8 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Link
                  href="/"
                  className="rounded-xl bg-[#fff7ea]/10 p-2 text-[#fff6ec] transition-colors hover:bg-[#fff7ea]/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-[#f1c48f]">
                    Profile
                  </p>
                  <h1 className="text-xl font-bold text-[#fff6ec] md:text-2xl">
                    Member Details
                  </h1>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                <Avatar className="h-24 w-24 border-4 border-[#f2dcc0]/45 shadow-xl">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="bg-[#fff7ea]/20 text-2xl font-bold text-[#fff6ec]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-[#fff6ec]">
                    {user.name || "Unknown user"}
                  </h2>
                  <p className="mt-1 text-sm text-[#f3ddbf]">{user.email}</p>
                  <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                    {user.membershipStatus === "pro" ? (
                      <Badge className="bg-[#ebb06e]/25 text-[#fff1d9] hover:bg-[#ebb06e]/25">
                        Pro
                      </Badge>
                    ) : (
                      <Badge className="bg-[#fff7ea]/16 text-[#fff1d9]/80 hover:bg-[#fff7ea]/16">
                        Basic
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-[1.8rem] border border-[#e7c49e]/35 bg-[#fff7ea]/10 p-4 backdrop-blur-sm">
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
            <div className="rounded-[1.7rem] border border-[#d9b58c]/60 bg-[#fff9f0] px-4 py-3 shadow-[0_18px_45px_rgba(86,58,35,0.08)]">
              <p className="mb-0.5 text-xs text-[#8f6d52]">Account ID</p>
              <p className="truncate font-mono text-sm text-[#6f5138]">{user.id}</p>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[#d9b58c]/60 bg-[#fff9f0] px-4 py-4 shadow-[0_18px_45px_rgba(86,58,35,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1dfc5]">
                  <Crown className="h-5 w-5 text-[#ab6534]" />
                </div>
                <div>
                  <p className="text-xs text-[#8f6d52]">Membership</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {user.membershipStatus === "pro" ? (
                      <Badge className="bg-[#d9f0d8] text-[#2f6d3a] hover:bg-[#d9f0d8]">
                        Pro
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-[#f1dfc5] text-[#9d6030]"
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
                    className="h-8 rounded-xl bg-[#9d6030] text-[#fff8ed] hover:bg-[#85502a]"
                  >
                    Upgrade to Pro
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-2 border-t border-[#ead2b3] pt-3 text-sm text-[#6f5138]">
              <Navigation className="h-4 w-4 flex-shrink-0 text-[#8f6d52]" />
              <span>
                Route calculations this month: <strong>{monthlyUsage}</strong>
              </span>
            </div>
          </div>

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
    <div className="flex items-center gap-3 rounded-[1.7rem] border border-[#d9b58c]/60 bg-[#fff9f0] px-4 py-3 shadow-[0_18px_45px_rgba(86,58,35,0.08)]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1dfc5]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#8f6d52]">{label}</p>
        <p className="truncate text-sm font-medium text-[#4a3223]">{value}</p>
      </div>
    </div>
  );
}
