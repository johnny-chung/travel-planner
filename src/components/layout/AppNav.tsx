import { getSession } from "@/features/auth/session";
import { getNavigationSummary } from "@/features/navigation/service";
import AppNavClient from "@/components/layout/AppNavClient";

export default async function AppNav() {
  const session = await getSession();

  if (!session?.user?.id) {
    return <AppNavClient user={null} membershipStatus="basic" notificationCount={0} />;
  }

  const summary = await getNavigationSummary(session.user.id);

  return (
    <AppNavClient
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      }}
      membershipStatus={summary.membershipStatus}
      notificationCount={summary.notificationCount}
    />
  );
}
