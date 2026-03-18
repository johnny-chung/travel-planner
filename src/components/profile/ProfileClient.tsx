"use client";

import { Mail, Phone, User, LogOut, ArrowLeft, Crown, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import Link from "next/link";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    phone: string;
    membershipStatus: string;
    navigationUsage: string[];
  };
};

export default function ProfileClient({ user }: Props) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0 md:pt-16">
      {/* Blue header */}
      <div className="bg-blue-600 text-white px-5 pt-12 pb-20 md:pt-10 md:pb-24 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Mobile back button */}
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-xl">Profile</h1>
          </div>
          {/* Desktop title */}
          <h1 className="hidden md:block font-bold text-2xl mb-6">Profile</h1>

          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="bg-blue-400 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-xl font-bold">{user.name || "Unknown user"}</h2>
            <p className="text-blue-200 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="px-4 -mt-8 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow icon={<User className="w-5 h-5 text-blue-500" />} label="Full Name" value={user.name || "—"} />
          <InfoRow icon={<Mail className="w-5 h-5 text-blue-500" />} label="Email" value={user.email || "—"} />
          {user.phone && (
            <InfoRow icon={<Phone className="w-5 h-5 text-blue-500" />} label="Phone" value={user.phone} />
          )}
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">Account ID</p>
            <p className="text-sm text-gray-500 font-mono truncate">{user.id}</p>
          </div>
        </div>

        <div className="mt-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Membership</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {user.membershipStatus === "pro" ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs px-2 py-0">Pro</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-2 py-0">Basic</Badge>
                  )}
                </div>
              </div>
            </div>
            {user.membershipStatus !== "pro" && (
              <Link href="/upgrade">
                <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-xs h-8">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-50">
            <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>
              Navigation this month:{" "}
              <strong>
                {user.membershipStatus === "pro"
                  ? "Unlimited"
                  : (() => {
                      const now = new Date();
                      const thisMonth = user.navigationUsage.filter((d) => {
                        const date = new Date(d);
                        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
                      }).length;
                      return `${thisMonth} / 3`;
                    })()}
              </strong>
            </span>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl text-red-500 border-red-200 hover:bg-red-50 gap-2 font-semibold"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}


