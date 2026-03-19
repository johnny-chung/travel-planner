"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  FileText,
  Contact,
  Minus,
  RefreshCw,
} from "lucide-react";
import {
  addStopArrivalAction,
  removeStopArrivalAction,
  type StopFormActionState,
  updateStopAction,
  deleteStopAction,
} from "@/features/stops/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Stop, TripDoc } from "@/components/map/plan-map/types";
import TimePicker from "@/components/ui/TimePicker";

type Props = {
  tripId: string;
  stop: Stop;
  isEdit: boolean;
  tripDocs?: TripDoc[];
  closeHref: string;
  viewHref: string;
  editHref: string;
  prevHref?: string | null;
  nextHref?: string | null;
  deleteReturnTo: string;
};

const initialState: StopFormActionState = {};

export default function StopDetailModal({
  tripId,
  stop,
  isEdit,
  tripDocs = [],
  closeHref,
  viewHref,
  editHref,
  prevHref,
  nextHref,
  deleteReturnTo,
}: Props) {
  const router = useRouter();
  const canEdit = stop.editable !== false;
  const [updateState, updateFormAction] = useActionState(
    updateStopAction,
    initialState,
  );
  const [addArrivalState, addArrivalFormAction] = useActionState(
    addStopArrivalAction,
    initialState,
  );
  const [date, setDate] = useState(stop.date);
  const [time, setTime] = useState(stop.time);
  const [notes, setNotes] = useState(stop.notes);
  const [linkedDocIds, setLinkedDocIds] = useState<string[]>(
    stop.linkedDocIds ?? [],
  );
  const [showHours, setShowHours] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showVisitAgain, setShowVisitAgain] = useState(false);
  const [newArrivalDate, setNewArrivalDate] = useState("");
  const [newArrivalTime, setNewArrivalTime] = useState("");
  const [showArrivals, setShowArrivals] = useState(true);

  function toggleDoc(id: string) {
    setLinkedDocIds((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }

  const linkedDocs = tripDocs.filter((document) =>
    (stop.linkedDocIds ?? []).includes(document._id),
  );
  const editLinkedDocs = tripDocs.filter((document) =>
    linkedDocIds.includes(document._id),
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}&query_place_id=${stop.placeId}`;

  const formattedDate = (() => {
    try {
      return format(new Date(`${stop.date}T00:00:00`), "EEE, MMM d, yyyy");
    } catch {
      return stop.date;
    }
  })();

  const hasContact = !!(stop.phone || stop.address);

  const arrivals = useMemo(() => {
    const currentArrivals = stop.arrivals ?? [];
    const currentIndex = stop._arrivalIndex ?? 0;
    if (!isEdit) {
      return currentArrivals;
    }

    if (currentArrivals.length <= 1) {
      return [{ date, time }];
    }

    return currentArrivals.map((arrival, index) =>
      index === currentIndex ? { date, time } : arrival,
    );
  }, [date, isEdit, stop._arrivalIndex, stop.arrivals, time]);

  const showTime = stop.displayTime !== false;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => router.push(closeHref)}
      />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 pt-4 pb-2 px-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <span className="text-white text-xs font-bold">{stop.order}</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-lg leading-tight">
                  {stop.name}
                </h2>
                <p className="text-gray-400 text-sm truncate mt-0.5">
                  {stop.address}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(closeHref)}
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
          {stop.thumbnail ? (
            <div className="rounded-2xl overflow-hidden h-40 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stop.thumbnail}
                alt={stop.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          {isEdit && canEdit ? (
            <form id="stop-update-form" action={updateFormAction} className="space-y-4">
              <input type="hidden" name="tripId" value={tripId} />
              <input type="hidden" name="stopId" value={stop._id} />
              <input type="hidden" name="returnTo" value={viewHref} />
              {arrivals.map((arrival, index) => (
                <input
                  key={`${arrival.date}-${arrival.time}-${index}`}
                  type="hidden"
                  name="arrivals"
                  value={`${arrival.date}|${arrival.time}`}
                />
              ))}
              {linkedDocIds.map((documentId) => (
                <input
                  key={documentId}
                  type="hidden"
                  name="linkedDocIds"
                  value={documentId}
                />
              ))}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">
                    Time
                  </Label>
                  <TimePicker value={time} onChange={setTime} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">
                  Notes
                </Label>
                <Textarea
                  name="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="rounded-xl resize-none text-sm"
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>

              {tripDocs.length > 0 ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">
                    Linked Documents
                  </Label>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
                    {tripDocs.map((document) => {
                      const checked = linkedDocIds.includes(document._id);
                      return (
                        <button
                          key={document._id}
                          type="button"
                          onClick={() => toggleDoc(document._id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${checked ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                            {checked ? (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 10 10"
                              >
                                <path
                                  d="M1.5 5l2.5 2.5 4.5-4.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </div>
                          <FileText
                            className={`w-4 h-4 shrink-0 ${checked ? "text-blue-500" : "text-gray-400"}`}
                          />
                          <span
                            className={`text-sm font-medium truncate ${checked ? "text-blue-700" : "text-gray-700"}`}
                          >
                            {document.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {editLinkedDocs.length > 0 ? (
                    <p className="text-xs text-blue-500">
                      {editLinkedDocs.length} document
                      {editLinkedDocs.length !== 1 ? "s" : ""} linked
                    </p>
                  ) : null}
                </div>
              ) : null}
              {updateState.error ? (
                <p className="text-sm text-red-500">{updateState.error}</p>
              ) : null}
            </form>
          ) : (
            <div className="space-y-3">
              {(stop.arrivals && stop.arrivals.length > 1) ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowArrivals((value) => !value)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Arrival Times
                      <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {stop.arrivals.length}
                      </span>
                    </span>
                    {showArrivals ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {showArrivals ? (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {stop.arrivals.map((arrival, index) => {
                        const isCurrentArrival =
                          index === (stop._arrivalIndex ?? 0);
                        const formattedArrivalDate = (() => {
                          try {
                            return format(
                              new Date(`${arrival.date}T00:00:00`),
                              "EEE, MMM d, yyyy",
                            );
                          } catch {
                            return arrival.date;
                          }
                        })();

                        return (
                          <div
                            key={`${arrival.date}-${arrival.time}-${index}`}
                            className={`flex items-center gap-3 px-4 py-3 ${isCurrentArrival ? "bg-blue-50" : ""}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-blue-700">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">
                                  {formattedArrivalDate}
                                </span>
                              </div>
                              {showTime ? (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <div className="flex items-center gap-1.5 text-blue-700">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-sm font-semibold">
                                      {arrival.time}
                                    </span>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                            {canEdit ? (
                            <form action={removeStopArrivalAction}>
                              <input type="hidden" name="tripId" value={tripId} />
                              <input type="hidden" name="stopId" value={stop._id} />
                              <input type="hidden" name="arrivalIndex" value={index} />
                              <input type="hidden" name="returnTo" value={viewHref} />
                              <button
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Remove this arrival"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </form>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-semibold">{formattedDate}</span>
                  </div>
                  {showTime ? (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">{stop.time}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {stop.notes ? (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 font-medium mb-1">NOTES</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {stop.notes}
                  </p>
                </div>
              ) : null}

              {hasContact ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowContact((value) => !value)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Contact className="w-4 h-4 text-gray-400" /> Contact
                    </span>
                    {showContact ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {showContact ? (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {stop.address ? (
                        <div className="flex items-start gap-3 px-4 py-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700">{stop.address}</span>
                        </div>
                      ) : null}
                      {stop.phone ? (
                        <a
                          href={`tel:${stop.phone}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">
                            {stop.phone}
                          </span>
                        </a>
                      ) : null}
                      {stop.website ? (
                        <a
                          href={stop.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-blue-600 font-medium truncate">
                            {stop.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {stop.openingHours.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowHours((value) => !value)}
                  >
                    <span className="text-sm font-semibold text-gray-700">
                      Opening Hours
                    </span>
                    {showHours ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {showHours ? (
                    <div className="px-4 pb-3 pt-1 space-y-1 border-t border-gray-100">
                      {stop.openingHours.map((openingHour, index) => (
                        <p
                          key={`${openingHour}-${index}`}
                          className="text-xs text-gray-500 py-0.5"
                        >
                          {openingHour}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {tripDocs.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDocs((value) => !value)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-gray-400" /> Documents
                      {linkedDocs.length > 0 ? (
                        <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                          {linkedDocs.length}
                        </span>
                      ) : null}
                    </span>
                    {showDocs ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {showDocs ? (
                    <div className="border-t border-gray-100">
                      {linkedDocs.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs py-4">
                          No documents linked to this stop
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {linkedDocs.map((document) => (
                            <a
                              key={document._id}
                              href={document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                            >
                              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate transition-colors">
                                {document.name}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {addArrivalState.error && canEdit ? (
                <p className="text-sm text-red-500">{addArrivalState.error}</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-6 pb-8 pt-3 border-t border-gray-100 space-y-3">
          {isEdit && canEdit ? (
            confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-center text-gray-500">
                  Are you sure you want to delete this stop?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11"
                    onClick={() => setConfirmDelete(false)}
                  >
                    No, keep it
                  </Button>
                  <form action={deleteStopAction} className="flex-1">
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="stopId" value={stop._id} />
                    <input type="hidden" name="returnTo" value={deleteReturnTo} />
                    <SubmitButton
                      variant="destructive"
                      className="w-full rounded-xl h-11"
                      pendingLabel="Deleting..."
                    >
                      Yes, delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11"
                    onClick={() => router.push(viewHref)}
                  >
                    Cancel
                  </Button>
                  <SubmitButton
                    form="stop-update-form"
                    className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
                    disabled={!date || !time}
                    pendingLabel="Saving..."
                  >
                    Save Changes
                  </SubmitButton>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-10 gap-2 text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4" /> Delete Stop
                </Button>
              </div>
            )
          ) : (
            <div className="flex gap-2 items-stretch">
              <button
                onClick={() => prevHref && router.push(prevHref)}
                disabled={!prevHref}
                className="flex flex-col items-center justify-center w-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Previous stop"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex-1 space-y-2">
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full rounded-xl h-11 bg-blue-600 hover:bg-blue-700 gap-2 font-semibold">
                    <ExternalLink className="w-4 h-4" /> Open in Google Maps
                  </Button>
                </a>
                <div className="flex gap-2">
                  {canEdit ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-10 gap-2"
                        onClick={() => router.push(editHref)}
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-10 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setNewArrivalDate("");
                          setNewArrivalTime("");
                          setShowVisitAgain(true);
                        }}
                      >
                        <RefreshCw className="w-4 h-4" /> Visit Again
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => nextHref && router.push(nextHref)}
                disabled={!nextHref}
                className="flex flex-col items-center justify-center w-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Next stop"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showVisitAgain && canEdit ? (
        <div className="absolute inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowVisitAgain(false)}
          />
          <form
            action={addArrivalFormAction}
            className="relative bg-white rounded-3xl shadow-2xl p-6 mx-4 w-full max-w-sm space-y-4 z-10"
          >
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="stopId" value={stop._id} />
            <input type="hidden" name="returnTo" value={viewHref} />
            <h3 className="font-bold text-gray-900 text-lg">Add Arrival Time</h3>
            <p className="text-sm text-gray-500 -mt-1">{stop.name}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">Date</Label>
                <Input
                  type="date"
                  name="date"
                  value={newArrivalDate}
                  onChange={(event) => setNewArrivalDate(event.target.value)}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">Time</Label>
                <TimePicker value={newArrivalTime} onChange={setNewArrivalTime} />
                <input type="hidden" name="time" value={newArrivalTime} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl h-11"
                onClick={() => setShowVisitAgain(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700"
                disabled={!newArrivalDate || !newArrivalTime}
                pendingLabel="Adding..."
              >
                Add
              </SubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
