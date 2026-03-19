"use client";

import { useRouter } from "next/navigation";
import {
  BedDouble,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TripStayItem } from "@/types/trip-logistics";

type Props = {
  stay: TripStayItem;
  closeHref: string;
};

export default function StayDetailModal({ stay, closeHref }: Props) {
  const router = useRouter();
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.address)}&query_place_id=${stay.placeId}`;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => router.push(closeHref)}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex-shrink-0 px-6 pb-2 pt-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-emerald-100 p-2.5 text-emerald-700">
                <BedDouble className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-900">
                  {stay.name}
                </h2>
                <p className="mt-0.5 text-sm text-gray-400">
                  {stay.checkInDate} to {stay.checkOutDate}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(closeHref)}
              className="ml-2 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
          {stay.thumbnail ? (
            <div className="h-44 overflow-hidden rounded-2xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stay.thumbnail}
                alt={stay.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Contact
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex items-start gap-3 px-4 py-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm text-gray-700">{stay.address}</span>
              </div>
              {stay.phone ? (
                <a
                  href={`tel:${stay.phone}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {stay.phone}
                  </span>
                </a>
              ) : null}
              {stay.website ? (
                <a
                  href={stay.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate text-sm font-medium text-blue-600">
                    {stay.website.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-100 px-6 pb-8 pt-3">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="h-11 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-700">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Google Maps
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
