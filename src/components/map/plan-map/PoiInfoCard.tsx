"use client";

import { ExternalLink, Plus, X } from "lucide-react";
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
