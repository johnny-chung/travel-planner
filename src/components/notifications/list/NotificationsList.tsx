import { Bell, Check, User, X } from "lucide-react";
import {
  approveTripRequestAction,
  denyTripRequestAction,
} from "@/features/trips/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import { Card, CardContent } from "@/components/ui/card";
import type { NotificationItem } from "@/types/travel";

type Props = {
  notifications: NotificationItem[];
};

export default function NotificationsList({ notifications }: Props) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mb-4">
          <Bell className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">No pending requests</h3>
        <p className="text-muted-foreground text-sm mt-1">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const key = `${notification.planId}-${notification.userId}`;

        return (
          <Card key={key} className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-500" />
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
                    Wants to join{" "}
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
                    Approve
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
                    Deny
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
