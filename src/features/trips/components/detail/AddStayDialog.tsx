"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  addStayAction,
  type TripLogisticsActionState,
  updateStayAction,
} from "@/features/trip-logistics/actions";
import {
  addGuestStayAction,
  type GuestFormActionState,
  updateGuestStayAction,
} from "@/features/guest/actions";
import type { PendingLocation } from "@/features/planner/components/plan-map/types";
import PlaceSearchInput from "@/features/places/components/PlaceSearchInput";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getClientDictionary } from "@/features/i18n/client";
import type { TripStayItem } from "@/types/trip-logistics";

type Props = {
  tripId: string;
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStay?: TripStayItem | null;
  accessMode?: "user" | "guest";
};

const initialState: TripLogisticsActionState = {};
const initialGuestState: GuestFormActionState = {};

export default function AddStayDialog({
  tripId,
  apiKey,
  open,
  onOpenChange,
  initialStay = null,
  accessMode = "user",
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const isEditing = Boolean(initialStay);
  const isGuest = accessMode === "guest";
  const [userState, userFormAction] = useActionState(
    isEditing ? updateStayAction : addStayAction,
    initialState,
  );
  const [guestState, guestFormAction] = useActionState(
    isEditing ? updateGuestStayAction : addGuestStayAction,
    initialGuestState,
  );
  const state = isGuest ? guestState : userState;
  const formAction = isGuest ? guestFormAction : userFormAction;
  const [query, setQuery] = useState(initialStay?.name ?? "");
  const [location, setLocation] = useState<PendingLocation | null>(
    initialStay
      ? {
          name: initialStay.name,
          address: initialStay.address,
          placeId: initialStay.placeId,
          lat: initialStay.lat,
          lng: initialStay.lng,
          thumbnail: initialStay.thumbnail,
          phone: initialStay.phone,
          website: initialStay.website,
          openingHours: [],
        }
      : null,
  );
  const [relaxedSearch, setRelaxedSearch] = useState(false);
  const [checkInDate, setCheckInDate] = useState(initialStay?.checkInDate ?? "");
  const [checkOutDate, setCheckOutDate] = useState(initialStay?.checkOutDate ?? "");

  function resetForm() {
    setQuery(initialStay?.name ?? "");
    setLocation(
      initialStay
        ? {
            name: initialStay.name,
            address: initialStay.address,
            placeId: initialStay.placeId,
            lat: initialStay.lat,
            lng: initialStay.lng,
            thumbnail: initialStay.thumbnail,
            phone: initialStay.phone,
            website: initialStay.website,
            openingHours: [],
          }
        : null,
    );
    setRelaxedSearch(false);
    setCheckInDate(initialStay?.checkInDate ?? "");
    setCheckOutDate(initialStay?.checkOutDate ?? "");
  }

  useEffect(() => {
    if (!state.success) return;
    onOpenChange(false);
  }, [onOpenChange, state.success]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="rounded-3xl mx-4 max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? dictionary.tripDetail.editStay : dictionary.tripDetail.addStay}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tripId" value={tripId} />
          {isEditing ? (
            <input type="hidden" name="stayId" value={initialStay?._id ?? ""} />
          ) : null}
          <input type="hidden" name="name" value={location?.name ?? ""} />
          <input type="hidden" name="address" value={location?.address ?? ""} />
          <input type="hidden" name="placeId" value={location?.placeId ?? ""} />
          <input type="hidden" name="lat" value={location?.lat ?? ""} />
          <input type="hidden" name="lng" value={location?.lng ?? ""} />
          <input
            type="hidden"
            name="thumbnail"
            value={location?.thumbnail ?? ""}
          />
          <input type="hidden" name="phone" value={location?.phone ?? ""} />
          <input type="hidden" name="website" value={location?.website ?? ""} />

          <div className="space-y-1.5">
            <Label>{dictionary.tripDetail.lodging}</Label>
            <PlaceSearchInput
              apiKey={apiKey}
              value={query}
              onChange={(value) => {
                setQuery(value);
                setLocation(null);
              }}
              onSelect={(selectedLocation) => {
                setQuery(selectedLocation.name);
                setLocation(selectedLocation);
              }}
              placeholder={dictionary.tripDetail.staySearchPlaceholder}
              includedPrimaryTypes={relaxedSearch ? undefined : ["lodging"]}
              autoFocus
            />
            {!relaxedSearch ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0 py-1 text-xs text-primary hover:text-primary/80"
                onClick={() => setRelaxedSearch(true)}
              >
                {dictionary.tripDetail.stayBroadenSearch}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {dictionary.tripDetail.stayBroadened}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{dictionary.tripDetail.stayPeriod}</Label>
            <DateRangePicker
              fromName="checkInDate"
              toName="checkOutDate"
              fromValue={checkInDate}
              toValue={checkOutDate}
              onChange={({ from, to }) => {
                setCheckInDate(from);
                setCheckOutDate(to);
              }}
              placeholder={dictionary.tripDetail.stayPeriodPlaceholder}
            />
          </div>

          {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}

          <DialogFooter className="gap-2 flex-row mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              {dictionary.tripCreate.cancel}
            </Button>
            <SubmitButton
              className="flex-1 rounded-xl"
              pendingLabel={isEditing ? dictionary.common.saving : dictionary.common.adding}
            >
              {isEditing ? dictionary.common.save : dictionary.common.add}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
