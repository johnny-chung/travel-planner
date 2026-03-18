"use client";
import { useRouter } from "next/navigation";
import TripListClient, { type Trip } from "./TripListClient";

type Props = { initialTrips: Trip[]; googleMapsApiKey: string };

export default function ExpensePageClient({ initialTrips, googleMapsApiKey }: Props) {
  const router = useRouter();
  return (
    <TripListClient
      initialTrips={initialTrips}
      user={{ name: "", image: "" }}
      googleMapsApiKey={googleMapsApiKey}
      pageTitle="Expenses"
      onCardClick={(id) => router.push(`/expense/${id}`)}
      showCreate={false}
    />
  );
}
