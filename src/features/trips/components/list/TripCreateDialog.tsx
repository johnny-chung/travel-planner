"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  createTripAction,
  joinTripAction,
  type FormActionState,
} from "@/features/trips/actions";
import { createTrialTripAction } from "@/features/guest/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import LocationSearchInput from "@/features/places/components/LocationSearchInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getClientDictionary } from "@/features/i18n/client";

type Props = {
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "user" | "guest";
  allowJoin?: boolean;
  title?: string;
};

const initialState: FormActionState = {};

export default function TripCreateDialog({
  apiKey,
  open,
  onOpenChange,
  mode = "user",
  allowJoin = true,
  title = "New Trip",
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const createAction = mode === "guest" ? createTrialTripAction : createTripAction;
  const [createState, createFormAction] = useActionState<FormActionState, FormData>(
    createAction,
    initialState,
  );
  const [joinState, joinFormAction] = useActionState<FormActionState, FormData>(
    joinTripAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationPlaceId, setLocationPlaceId] = useState("");
  const [locationCountryCode, setLocationCountryCode] = useState("");
  const [locationThumbnail, setLocationThumbnail] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [rentCar, setRentCar] = useState(false);

  const isJoining = joinCode.trim().length > 0;

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setLocationLat(null);
    setLocationLng(null);
    setLocationPlaceId("");
    setLocationCountryCode("");
    setLocationThumbnail("");
    setJoinCode("");
    setRentCar(false);
  }

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
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {allowJoin ? (
          <form action={joinFormAction} className="space-y-2">
            <Label>{dictionary.tripCreate.joinExisting}</Label>
            <div className="relative">
              <Input
                name="shareCode"
                placeholder={dictionary.tripCreate.shareCodePlaceholder}
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(event.target.value.toUpperCase().slice(0, 6))
                }
                className="rounded-xl h-11 uppercase tracking-widest font-mono pr-8"
              />
              {joinCode ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setJoinCode("")}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            {joinCode.length > 0 ? (
              <p className="text-xs text-primary">
                {dictionary.tripCreate.joinHelp}
              </p>
            ) : null}
            {joinState.error ? (
              <p className="text-sm text-red-500">{joinState.error}</p>
            ) : null}
            {isJoining ? (
              <div className="pt-1">
                <SubmitButton
                  className="w-full rounded-xl"
                  pendingLabel={dictionary.tripCreate.sending}
                  disabled={joinCode.length < 4}
                >
                  {dictionary.tripCreate.requestAccess}
                </SubmitButton>
              </div>
            ) : null}
          </form>
          ) : null}

          {!isJoining ? (
            <form action={createFormAction} className="space-y-4">
              {allowJoin ? (
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs">
                  <div className="flex-1 h-px bg-border" />
                  {dictionary.tripCreate.or}
                  <div className="flex-1 h-px bg-border" />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>
                  {dictionary.tripCreate.tripName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="name"
                  placeholder={dictionary.tripCreate.tripNamePlaceholder}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl h-11"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {dictionary.tripCreate.startingLocation}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({dictionary.tripCreate.optional})
                  </span>
                </Label>
                <LocationSearchInput
                  value={location}
                  onChange={(text) => {
                    setLocation(text);
                    setLocationLat(null);
                    setLocationLng(null);
                    setLocationPlaceId("");
                    setLocationCountryCode("");
                    setLocationThumbnail("");
                  }}
                  onSelect={(selectedLocation) => {
                    setLocation(selectedLocation.name);
                    setLocationLat(selectedLocation.lat);
                    setLocationLng(selectedLocation.lng);
                    setLocationPlaceId(selectedLocation.placeId);
                    setLocationCountryCode(selectedLocation.countryCode);
                    setLocationThumbnail(selectedLocation.thumbnail);
                  }}
                  apiKey={apiKey}
                />
                <input type="hidden" name="location" value={location} />
                <input type="hidden" name="locationLat" value={locationLat ?? ""} />
                <input type="hidden" name="locationLng" value={locationLng ?? ""} />
                <input type="hidden" name="locationPlaceId" value={locationPlaceId} />
                <input type="hidden" name="locationCountryCode" value={locationCountryCode} />
                <input type="hidden" name="locationThumbnail" value={locationThumbnail} />
              </div>
              <div className="space-y-2">
                <Label>
                  {dictionary.tripCreate.description}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({dictionary.tripCreate.optional})
                  </span>
                </Label>
                <Textarea
                  name="description"
                  placeholder={dictionary.tripCreate.descriptionPlaceholder}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  className="rounded-xl resize-none"
                  rows={2}
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {description.length}/500
                </p>
              </div>
              <div className="flex items-center gap-3 py-1">
                <Switch
                  checked={rentCar}
                  onCheckedChange={setRentCar}
                  name="transportMode"
                  value="drive"
                  uncheckedValue="transit"
                  aria-label={dictionary.tripCreate.rentCar}
                />
                <Label className="text-sm text-foreground">
                  {dictionary.tripCreate.rentCar}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({dictionary.tripCreate.rentCarHint})
                  </span>
                </Label>
              </div>
              {createState.error ? (
                <p className="text-sm text-red-500">{createState.error}</p>
              ) : null}
              <DialogFooter className="gap-2 flex-row">
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
                  pendingLabel={dictionary.tripCreate.creating}
                  disabled={!name.trim()}
                >
                  {dictionary.tripCreate.create}
                </SubmitButton>
              </DialogFooter>
            </form>
          ) : (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
              >
                {dictionary.tripCreate.cancel}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
