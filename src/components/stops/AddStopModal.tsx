"use client";

import { useActionState, useState } from "react";
import { MapPin, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { createStopAction, type StopFormActionState } from "@/features/stops/actions";
import { createGuestStopAction } from "@/features/guest/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import TimePicker from "@/components/ui/TimePicker";
import type { TripDoc } from "@/components/map/plan-map/types";

type Location = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  openingHours: string[];
  phone: string;
  website: string;
  thumbnail: string;
};

type Props = {
  tripId: string;
  location: Location;
  tripDocs?: TripDoc[];
  returnTo: string;
  onCancel: () => void;
  accessMode?: "user" | "guest";
};

const initialState: StopFormActionState = {};

export default function AddStopModal({
  tripId,
  location,
  tripDocs = [],
  returnTo,
  onCancel,
  accessMode = "user",
}: Props) {
  const createAction =
    accessMode === "guest" ? createGuestStopAction : createStopAction;
  const [state, formAction] = useActionState(createAction, initialState);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedDocIds, setLinkedDocIds] = useState<string[]>([]);
  const [docsOpen, setDocsOpen] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);

  function toggleDoc(id: string) {
    setLinkedDocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <form
        action={formAction}
        className="relative z-10 flex max-h-[calc(100vh-6.5rem-env(safe-area-inset-bottom))] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 md:max-h-[90vh]"
      >
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="name" value={location.name} />
        <input type="hidden" name="address" value={location.address} />
        <input type="hidden" name="lat" value={location.lat} />
        <input type="hidden" name="lng" value={location.lng} />
        <input type="hidden" name="placeId" value={location.placeId} />
        <input type="hidden" name="phone" value={location.phone} />
        <input type="hidden" name="website" value={location.website} />
        <input type="hidden" name="thumbnail" value={location.thumbnail} />
        {location.openingHours.map((openingHour, index) => (
          <input
            key={`${openingHour}-${index}`}
            type="hidden"
            name="openingHours"
            value={openingHour}
          />
        ))}
        <div className="flex-shrink-0 p-6 pb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{location.name}</h2>
                <p className="text-gray-400 text-sm truncate mt-0.5">{location.address}</p>
              </div>
            </div>
            <button type="button" onClick={onCancel} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 ml-2 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Save for later</p>
                <p className="text-xs text-muted-foreground">
                  Keep this stop unscheduled for now.
                </p>
              </div>
              <Switch
                checked={saveForLater}
                onCheckedChange={(checked) => {
                  setSaveForLater(checked);
                  if (checked) {
                    setDate("");
                    setTime("");
                  }
                }}
                aria-label="Save stop for later"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Date
              </Label>
              <Input
                type="date"
                name="date"
                value={date}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setDate(nextDate);
                  if (!nextDate) {
                    setTime("");
                  }
                }}
                className="rounded-xl h-11"
                disabled={saveForLater}
              />
              <p className="text-xs text-muted-foreground">
                Required unless you save this stop for later.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Time</Label>
              <TimePicker
                value={time}
                onChange={setTime}
                className={saveForLater ? "pointer-events-none opacity-50" : ""}
              />
              <input type="hidden" name="time" value={time} />
              <p className="text-xs text-muted-foreground">
                Optional even when a date is selected.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              name="notes"
              placeholder="Add notes about this stop..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {tripDocs.length > 0 && (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setDocsOpen(v => !v)}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4 text-gray-400" /> Link Documents
                  {linkedDocIds.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">{linkedDocIds.length}</span>
                  )}
                </span>
                {docsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {docsOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {tripDocs.map(doc => {
                    const checked = linkedDocIds.includes(doc._id);
                    return (
                      <button
                        key={doc._id}
                        type="button"
                        onClick={() => toggleDoc(doc._id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${checked ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                          {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <FileText className={`w-4 h-4 shrink-0 ${checked ? "text-blue-500" : "text-gray-400"}`} />
                          <span className={`text-sm font-medium truncate ${checked ? "text-blue-700" : "text-gray-700"}`}>{doc.name}</span>
                        </button>
                      );
                  })}
                </div>
              )}
            </div>
          )}
          {linkedDocIds.map((docId) => (
            <input key={docId} type="hidden" name="linkedDocIds" value={docId} />
          ))}
          {state.error ? (
            <p className="text-sm text-red-500">{state.error}</p>
          ) : null}
        </div>

        <div className="flex-shrink-0 flex gap-3 border-t border-gray-100 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:pb-8">
          <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={onCancel}>
            Cancel
          </Button>
          <SubmitButton
            className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
            pendingLabel="Saving..."
          >
            Save Stop
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
