"use client";

import { useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Phone,
  Plus,
  Star,
  X,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PendingLocation } from "@/components/map/plan-map/types";

type Props = {
  poiInfo: PendingLocation;
  isArchived: boolean;
  onAdd: () => void;
  onClose: () => void;
};

export default function PoiInfoCard({
  poiInfo,
  isArchived,
  onAdd,
  onClose,
}: Props) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const hasOpeningHours = poiInfo.openingHours.length > 0;
  const hasContact = Boolean(poiInfo.phone || poiInfo.website);
  const hasRating = typeof poiInfo.rating === "number";

  return (
    <div className="absolute bottom-20 left-3 right-3 z-30 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
      {poiInfo.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poiInfo.thumbnail}
          alt={poiInfo.name}
          className="w-full h-32 object-cover"
        />
      ) : null}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight">
          {poiInfo.name}
        </h3>
        <p className="text-gray-400 text-xs mt-1 leading-snug">
          {poiInfo.address}
        </p>
        {hasRating || hasOpeningHours || hasContact ? (
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            {hasRating ? (
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-gray-800">
                  {poiInfo.rating?.toFixed(1)}
                </span>
                {poiInfo.userRatingCount ? (
                  <span className="text-gray-400">
                    ({poiInfo.userRatingCount.toLocaleString()} reviews)
                  </span>
                ) : null}
              </div>
            ) : null}

            {hasOpeningHours ? (
              <Collapsible
                open={hoursOpen}
                onOpenChange={setHoursOpen}
                className="rounded-2xl border border-gray-100 bg-gray-50/70"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-gray-700">
                  <span>Opening hours</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      hoursOpen ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-2">
                  <div className="space-y-1 border-t border-gray-100 pt-2">
                  {poiInfo.openingHours.map((openingHour, index) => (
                    <p
                      key={`${openingHour}-${index}`}
                      className="text-gray-500"
                    >
                      {openingHour}
                    </p>
                  ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : null}

            {hasContact ? (
              <div className="flex flex-wrap gap-2">
                {poiInfo.phone ? (
                  <a
                    href={`tel:${poiInfo.phone}`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-gray-600 hover:bg-gray-50"
                  >
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{poiInfo.phone}</span>
                  </a>
                ) : null}
                {poiInfo.website ? (
                  <a
                    href={poiInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-gray-600 hover:bg-gray-50"
                  >
                    <Globe className="h-3 w-3" />
                    <span className="truncate max-w-[12rem]">
                      {poiInfo.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-2 mt-3">
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${poiInfo.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-9 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Google Maps
          </a>
          {!isArchived ? (
            <button
              className="flex-1 h-9 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"
              onClick={onAdd}
            >
              <Plus className="w-3.5 h-3.5" /> Add to Plan
            </button>
          ) : null}
          <button
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
