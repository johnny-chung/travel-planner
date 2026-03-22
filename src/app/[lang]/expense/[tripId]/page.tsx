import { redirect } from "next/navigation";

type Props = { params: Promise<{ tripId: string }> };

export default async function LegacyTripExpensePage({ params }: Props) {
  const { tripId } = await params;
  redirect(`/trips/${tripId}/expense`);
}
