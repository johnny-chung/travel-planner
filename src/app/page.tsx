import HomeClient from "@/features/home/components/HomeClient";
import PublicLandingPage from "@/features/home/components/PublicLandingPage";
import { getSession } from "@/features/auth/session";
import { getNavigationSummary } from "@/features/navigation/service";
import { getRecentTripSummariesForUser } from "@/features/trips/service";

export default async function Home() {
  const session = await getSession();
  if (!session?.user?.id) {
    return <PublicLandingPage />;
  }

  const [plans, navigation] = await Promise.all([
    getRecentTripSummariesForUser(session.user.id),
    getNavigationSummary(session.user.id),
  ]);

  return (
    <HomeClient
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      }}
      plans={plans}
      membershipStatus={navigation.membershipStatus}
    />
  );
}
