import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/profile/ProfileClient";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findOne({ userId: session.user.id }).lean() as {
    membershipStatus?: string;
    navigationUsage?: Date[];
  } | null;

  return (
    <ProfileClient
      user={{
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
        phone: session.user.phone ?? "",
        membershipStatus: user?.membershipStatus ?? "basic",
        navigationUsage: (user?.navigationUsage ?? []).map((d) => new Date(d).toISOString()),
      }}
    />
  );
}
