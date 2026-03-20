import { requireUserId } from "@/features/auth/session";
import { getTripNotificationsForOwner } from "@/features/trips/service";
import NotificationsList from "@/features/notifications/components/list/NotificationsList";

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const notifications = await getTripNotificationsForOwner(userId);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0 md:pt-16">
      <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pending join requests for your trips
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 max-w-2xl mx-auto w-full">
        <NotificationsList notifications={notifications} />
      </div>
    </div>
  );
}
