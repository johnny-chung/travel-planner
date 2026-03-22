"use client";

import { usePathname } from "next/navigation";
import { Bell, Check, User, X } from "lucide-react";
import {
  approveTripRequestAction,
  denyTripRequestAction,
} from "@/features/trips/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Card, CardContent } from "@/components/ui/card";
import { getClientDictionary } from "@/features/i18n/client";
import type { NotificationItem } from "@/types/travel";

type Props = {
  notifications: NotificationItem[];
};

export default function NotificationsList({ notifications }: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/12">
          <Bell className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">{dictionary.notificationsPage.emptyTitle}</h3>
        <p className="text-muted-foreground text-sm mt-1">{dictionary.notificationsPage.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const key = `${notification.planId}-${notification.userId}`;

        return (
          <Card key={key} className="rounded-xl border-border/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {notification.name || notification.userId}
                  </p>
                  {notification.email ? (
                    <p className="text-muted-foreground text-xs truncate">
                      {notification.email}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {dictionary.notificationsPage.wantsToJoin}{" "}
                    <span className="font-medium text-foreground">
                      {notification.planName}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <form action={approveTripRequestAction} className="flex-1">
                  <input type="hidden" name="tripId" value={notification.planId} />
                  <input type="hidden" name="requesterId" value={notification.userId} />
                  <SubmitButton className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {dictionary.notificationsPage.approve}
                  </SubmitButton>
                </form>
                <form action={denyTripRequestAction} className="flex-1">
                  <input type="hidden" name="tripId" value={notification.planId} />
                  <input type="hidden" name="requesterId" value={notification.userId} />
                  <SubmitButton
                    variant="outline"
                    className="w-full h-9 rounded-xl text-red-500 border-red-200 hover:bg-red-50 text-xs font-semibold gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    {dictionary.notificationsPage.deny}
                  </SubmitButton>
                </form>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
