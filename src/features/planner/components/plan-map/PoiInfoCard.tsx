"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PendingLocation } from "@/features/planner/components/plan-map/types";

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
  const photos = useMemo(() => {
    if (poiInfo.photos && poiInfo.photos.length > 0) {
      return poiInfo.photos;
    }

    if (poiInfo.thumbnail) {
      return [
        {
          src: poiInfo.thumbnail,
          attributions: [],
        },
      ];
    }

    return [];
  }, [poiInfo.photos, poiInfo.thumbnail]);

  return (
    <div className="absolute bottom-20 left-3 right-3 z-30 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in slide-in-from-bottom-4 md:left-auto md:right-7 md:w-[42rem]">
      <button
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/70 md:right-4 md:top-4"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="md:grid md:grid-cols-[1fr_19rem]">
        <div className="p-4 pb-3 md:flex md:min-h-[22rem] md:flex-col md:justify-between md:p-5">
          <div>
            <h3 className="pr-12 text-base font-bold leading-tight text-gray-900 md:text-lg">
              {poiInfo.name}
            </h3>
            <p className="mt-1 pr-8 text-xs leading-snug text-gray-400 md:text-sm">
              {poiInfo.address}
            </p>

            {hasRating || hasOpeningHours || hasContact ? (
              <div className="mt-4 space-y-3 text-xs text-gray-600 md:text-sm">
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
                        <span className="max-w-[12rem] truncate">
                          {poiInfo.website.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
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
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2 md:mt-5">
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${poiInfo.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Google Maps
            </a>
            {!isArchived ? (
              <button
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
                onClick={onAdd}
              >
                <Plus className="h-3.5 w-3.5" /> Add to Plan
              </button>
            ) : null}
          </div>
        </div>

        {photos.length > 0 ? (
          <div className="border-t border-gray-100 bg-gray-50 md:border-l md:border-t-0">
            <Carousel opts={{ loop: photos.length > 1 }} className="relative">
              <CarouselContent className="ml-0">
                {photos.map((photo, index) => (
                  <CarouselItem key={`${photo.src}-${index}`} className="pl-0">
                    <div className="relative h-52 w-full overflow-hidden md:h-full md:min-h-[22rem]">
                      <Image
                        src={photo.src}
                        alt={`${poiInfo.name} photo ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 304px"
                        className="object-cover"
                      />
                      {photo.attributions.length > 0 ? (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10 text-[11px] text-white/90">
                          Photo:&nbsp;
                          {photo.attributions.map((attribution, attributionIndex) => (
                            <span key={`${attribution.displayName}-${attributionIndex}`}>
                              {attribution.uri ? (
                                <a
                                  href={attribution.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2"
                                >
                                  {attribution.displayName}
                                </a>
                              ) : (
                                attribution.displayName
                              )}
                              {attributionIndex < photo.attributions.length - 1
                                ? ", "
                                : null}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {photos.length > 1 ? (
                <>
                  <CarouselPrevious className="left-3 border-white/30 bg-black/55 text-white hover:bg-black/70 hover:text-white disabled:opacity-40" />
                  <CarouselNext className="right-3 border-white/30 bg-black/55 text-white hover:bg-black/70 hover:text-white disabled:opacity-40" />
                </>
              ) : null}
            </Carousel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
