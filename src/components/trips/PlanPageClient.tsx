"use client";
import { useRouter } from "next/navigation";
import TripListClient, { type Trip } from "./TripListClient";

type Props = { initialTrips: Trip[]; googleMapsApiKey: string };

export default function PlanPageClient({ initialTrips, googleMapsApiKey }: Props) {
  const router = useRouter();
  return (
    <TripListClient
      initialTrips={initialTrips}
      user={{ name: "", image: "" }}
      googleMapsApiKey={googleMapsApiKey}
      pageTitle="Plan a Trip"
      onCardClick={(id) => router.push(`/plan/${id}`)}
      showCreate={false}
    />
  );
}
