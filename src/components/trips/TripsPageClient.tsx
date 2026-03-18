"use client";
import { useRouter } from "next/navigation";
import TripListClient, { type Trip } from "./TripListClient";

type Props = { initialTrips: Trip[]; googleMapsApiKey: string };

export default function TripsPageClient({ initialTrips, googleMapsApiKey }: Props) {
  const router = useRouter();
  return (
    <TripListClient
      initialTrips={initialTrips}
      user={{ name: "", image: "" }}
      googleMapsApiKey={googleMapsApiKey}
      pageTitle="My Trips"
      onCardClick={(id) => router.push(`/trips/${id}`)}
      showCreate
    />
  );
}
