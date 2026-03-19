"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import {
  createTripAction,
  joinTripAction,
  type FormActionState,
} from "@/features/trips/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import LocationSearchInput from "@/components/plans/LocationSearchInput";
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

type Props = {
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: FormActionState = {};

export default function TripCreateDialog({ apiKey, open, onOpenChange }: Props) {
  const [createState, createFormAction] = useActionState<FormActionState, FormData>(
    createTripAction,
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
  const [joinCode, setJoinCode] = useState("");
  const [rentCar, setRentCar] = useState(false);

  const isJoining = joinCode.trim().length > 0;

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setLocationLat(null);
    setLocationLng(null);
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
          <DialogTitle className="text-xl">New Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <form action={joinFormAction} className="space-y-2">
            <Label>Join existing trip</Label>
            <div className="relative">
              <Input
                name="shareCode"
                placeholder="6-letter code e.g. ABC123"
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
              <p className="text-xs text-blue-600">
                Enter a code to request access. The create form is disabled while joining.
              </p>
            ) : null}
            {joinState.error ? (
              <p className="text-sm text-red-500">{joinState.error}</p>
            ) : null}
            {isJoining ? (
              <div className="pt-1">
                <SubmitButton
                  className="w-full rounded-xl"
                  pendingLabel="Sending..."
                  disabled={joinCode.length < 4}
                >
                  Request Access
                </SubmitButton>
              </div>
            ) : null}
          </form>

          {!isJoining ? (
            <form action={createFormAction} className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground/60 text-xs">
                <div className="flex-1 h-px bg-border" />
                OR
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                <Label>
                  Trip Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="name"
                  placeholder="e.g. Japan Spring 2025"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl h-11"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Starting Location{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <LocationSearchInput
                  value={location}
                  onChange={(text) => {
                    setLocation(text);
                    setLocationLat(null);
                    setLocationLng(null);
                  }}
                  onSelect={(selectedLocation) => {
                    setLocation(selectedLocation.name);
                    setLocationLat(selectedLocation.lat);
                    setLocationLng(selectedLocation.lng);
                  }}
                  apiKey={apiKey}
                />
                <input type="hidden" name="location" value={location} />
                <input type="hidden" name="locationLat" value={locationLat ?? ""} />
                <input type="hidden" name="locationLng" value={locationLng ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>
                  Description{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  name="description"
                  placeholder="What's this trip about?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3 py-1">
                <Switch
                  checked={rentCar}
                  onCheckedChange={setRentCar}
                  name="transportMode"
                  value="drive"
                  uncheckedValue="transit"
                  aria-label="Will you rent a car?"
                />
                <Label className="text-sm text-foreground">
                  Will you rent a car?{" "}
                  <span className="text-muted-foreground text-xs">
                    (sets the default to Drive mode)
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
                  Cancel
                </Button>
                <SubmitButton
                  className="flex-1 rounded-xl"
                  pendingLabel="Creating..."
                  disabled={!name.trim()}
                >
                  Create
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
                Cancel
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
