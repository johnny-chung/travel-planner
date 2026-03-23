"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Contact,
  Edit2,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

import {
  deleteStopAction,
  duplicateStopAction,
  type StopFormActionState,
  updateStopAction,
} from "@/features/stops/actions";
import {
  deleteGuestStopAction,
  duplicateGuestStopAction,
  updateGuestStopAction,
} from "@/features/guest/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import TimePicker from "@/components/ui/TimePicker";
import { getClientDictionary } from "@/features/i18n/client";
import type { Stop, TripDoc } from "@/features/planner/components/plan-map/types";

type Props = {
  tripId: string;
  stop: Stop;
  relatedStops?: Stop[];
  isEdit: boolean;
  tripDocs?: TripDoc[];
  viewHref: string;
  editHref: string;
  prevHref?: string | null;
  nextHref?: string | null;
  tripDates?: string[];
  deleteReturnTo: string;
  accessMode?: "user" | "guest";
  canVisitAgain?: boolean;
};

const initialState: StopFormActionState = {};

export default function StopDetailModal({
  tripId,
  stop,
  relatedStops = [],
  isEdit,
  tripDocs = [],
  viewHref,
  editHref,
  prevHref,
  nextHref,
  tripDates = [],
  deleteReturnTo,
  accessMode = "user",
  canVisitAgain = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const canEdit = stop.editable !== false;
  const updateAction =
    accessMode === "guest" ? updateGuestStopAction : updateStopAction;
  const duplicateAction =
    accessMode === "guest" ? duplicateGuestStopAction : duplicateStopAction;
  const [updateState, updateFormAction] = useActionState(
    updateAction,
    initialState,
  );
  const [duplicateState, duplicateFormAction] = useActionState(
    duplicateAction,
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
  const [newVisitDate, setNewVisitDate] = useState("");
  const [newVisitTime, setNewVisitTime] = useState("");

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
  const relatedVisits = useMemo(
    () =>
      [...relatedStops]
        .filter((visit) => visit.isScheduled && visit.date)
        .sort(
          (left, right) =>
            `${left.date}T${left.time || "99:99"}`.localeCompare(
              `${right.date}T${right.time || "99:99"}`,
            ) || left.sequence - right.sequence,
        ),
    [relatedStops],
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}&query_place_id=${stop.placeId}`;
  const visitAgainDate = newVisitDate
    ? new Date(`${newVisitDate}T00:00:00`)
    : undefined;
  const editSelectedDate = date ? new Date(`${date}T00:00:00`) : undefined;
  const highlightedTripDates = useMemo(
    () =>
      tripDates
        .map((tripDate) => new Date(`${tripDate}T00:00:00`))
        .filter((tripDate) => !Number.isNaN(tripDate.getTime())),
    [tripDates],
  );
  const defaultTripMonth = highlightedTripDates[0] ?? new Date();

  const formattedDate = (() => {
    if (!stop.date) {
      return dictionary.planner.notScheduledYet;
    }

    try {
      return format(new Date(`${stop.date}T00:00:00`), "EEE, MMM d, yyyy");
    } catch {
      return stop.date;
    }
  })();

  const hasContact = !!(stop.phone || stop.address);

  return (
    <div className="relative flex h-full flex-col bg-card text-card-foreground">
      <div className="flex-shrink-0 px-6 pb-2 pt-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
            <span className="text-xs font-bold text-white">{stop.order}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight text-foreground">
              {stop.name}
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {stop.address}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-2">
        {stop.thumbnail ? (
          <div className="h-40 overflow-hidden rounded-2xl bg-muted">
            <Image
              src={stop.thumbnail}
              alt={stop.name}
              width={640}
              height={320}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {isEdit && canEdit ? (
          <form id="stop-update-form" action={updateFormAction} className="space-y-4">
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="stopId" value={stop._id} />
            <input type="hidden" name="returnTo" value={viewHref} />
            <input type="hidden" name="arrivals" value={`${date}|${time}`} />
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
                <Label className="text-xs font-medium text-gray-500">{dictionary.planner.date}</Label>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
                  <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <Calendar
                      mode="single"
                      selected={editSelectedDate}
                      defaultMonth={editSelectedDate ?? defaultTripMonth}
                      onSelect={(nextDate) => {
                        if (!nextDate) {
                          setDate("");
                          setTime("");
                          return;
                        }

                        setDate(format(nextDate, "yyyy-MM-dd"));
                      }}
                      modifiers={{ highlighted: highlightedTripDates }}
                      modifiersClassNames={{
                        highlighted:
                          "bg-emerald-500/15 font-semibold text-emerald-900 dark:text-emerald-100",
                      }}
                      className="mx-auto p-1.5 [--cell-size:2.5rem]"
                    />
                  </div>
                  <div className="space-y-2 rounded-2xl border border-border bg-background p-3">
                    <Label
                      htmlFor="stop-edit-date-input"
                      className="text-xs font-medium text-gray-500"
                    >
                      {dictionary.planner.enterDate}
                    </Label>
                    <Input
                      id="stop-edit-date-input"
                      type="date"
                      value={date}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        setDate(nextDate);
                        if (!nextDate) {
                          setTime("");
                        }
                      }}
                      className="h-11 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-full rounded-xl"
                      onClick={() => {
                        setDate("");
                        setTime("");
                      }}
                      disabled={!date}
                    >
                      {dictionary.planner.clearDate}
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  {dictionary.planner.dateBlankHint}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">{dictionary.planner.timeOptional}</Label>
                <TimePicker
                  value={time}
                  onChange={setTime}
                  clearLabel={dictionary.planner.clearTime}
                />
                <p className="text-[11px] text-gray-400">
                  {dictionary.planner.timeOptionalWhenDate}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">{dictionary.planner.notes}</Label>
              <Textarea
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                className="resize-none rounded-xl text-sm"
                rows={3}
                placeholder={dictionary.planner.notesPlaceholder}
              />
              <p className="text-right text-[11px] text-muted-foreground">
                {notes.length}/500
              </p>
            </div>

            {tripDocs.length > 0 ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">
                  {dictionary.planner.linkDocuments}
                </Label>
                <div className="divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-200">
                  {tripDocs.map((document) => {
                    const checked = linkedDocIds.includes(document._id);

                    return (
                      <button
                        key={document._id}
                        type="button"
                        onClick={() => toggleDoc(document._id)}
                        className={`w-full px-4 py-3 text-left transition-colors ${checked ? "bg-primary/8 dark:bg-primary/10" : "bg-card hover:bg-muted/60"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${checked ? "border-primary bg-primary" : "border-border"}`}
                          >
                            {checked ? (
                              <svg
                                className="h-2.5 w-2.5 text-white"
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
                            className={`h-4 w-4 shrink-0 ${checked ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span
                            className={`truncate text-sm font-medium ${checked ? "text-primary" : "text-foreground"}`}
                          >
                            {document.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {editLinkedDocs.length > 0 ? (
                  <p className="text-xs text-primary">
                    {(editLinkedDocs.length === 1
                      ? dictionary.planner.documentsLinkedCount
                      : dictionary.planner.documentsLinkedCountPlural
                    ).replace("{count}", String(editLinkedDocs.length))}
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
            {relatedVisits.length > 1 ? (
              <details open className="overflow-hidden rounded-2xl border border-border">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 transition-colors hover:bg-muted/60">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    {dictionary.planner.visitTimes}
                    <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {relatedVisits.length}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </summary>
                <div className="divide-y divide-border/60 border-t border-border">
                  {relatedVisits.map((visit) => {
                    const isCurrent = visit._id === stop._id;
                    const visitDate = (() => {
                      try {
                        return format(
                          new Date(`${visit.date}T00:00:00`),
                          "EEE, MMM d, yyyy",
                        );
                      } catch {
                        return visit.date;
                      }
                    })();

                    return (
                      <div
                        key={visit._id}
                        className={`flex items-center gap-3 px-4 py-3 ${isCurrent ? "bg-primary/8 dark:bg-primary/10" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-primary">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span className="text-sm font-medium">{visitDate}</span>
                            </div>
                            {visit.displayTime ? (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-1.5 text-primary">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="text-sm font-semibold">
                                    {visit.time}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {dictionary.planner.noTimeSet}
                              </span>
                            )}
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {dictionary.planner.current}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </details>
            ) : null}

            <div className="flex items-center gap-4 rounded-2xl bg-primary/8 p-4 dark:bg-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">{formattedDate}</span>
              </div>
              {stop.displayTime ? (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-semibold">{stop.time}</span>
                  </div>
                </>
              ) : null}
            </div>

            {stop.notes ? (
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium text-gray-400">{dictionary.planner.notes.toUpperCase()}</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {stop.notes}
                </p>
              </div>
            ) : null}

            {hasContact ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/60"
                  onClick={() => setShowContact((value) => !value)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Contact className="h-4 w-4 text-muted-foreground" />{" "}
                    {dictionary.planner.contact}
                  </span>
                  {showContact ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showContact ? (
                  <div className="divide-y divide-border/60 border-t border-border">
                    {stop.address ? (
                      <div className="flex items-start gap-3 px-4 py-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-foreground">{stop.address}</span>
                      </div>
                    ) : null}
                    {stop.phone ? (
                      <a
                        href={`tel:${stop.phone}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                      >
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {stop.phone}
                        </span>
                      </a>
                    ) : null}
                    {stop.website ? (
                      <a
                        href={stop.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                      >
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-primary">
                          {stop.website.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {stop.openingHours.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/60"
                  onClick={() => setShowHours((value) => !value)}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {dictionary.planner.openingHours}
                  </span>
                  {showHours ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showHours ? (
                  <div className="space-y-1 border-t border-border px-4 pb-3 pt-1">
                    {stop.openingHours.map((openingHour, index) => (
                      <p
                        key={`${openingHour}-${index}`}
                        className="py-0.5 text-xs text-muted-foreground"
                      >
                        {openingHour}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tripDocs.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/60"
                  onClick={() => setShowDocs((value) => !value)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                    {dictionary.planner.documents}
                    {linkedDocs.length > 0 ? (
                      <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-xs font-medium text-primary">
                        {linkedDocs.length}
                      </span>
                    ) : null}
                  </span>
                  {showDocs ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showDocs ? (
                  <div className="border-t border-border">
                    {linkedDocs.length === 0 ? (
                      <p className="py-4 text-center text-xs text-gray-400">
                        {dictionary.planner.noDocumentsLinked}
                      </p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {linkedDocs.map((document) => (
                          <a
                            key={document._id}
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/8 dark:hover:bg-primary/10"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <span className="flex-1 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                              {document.name}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            {duplicateState.error && canEdit ? (
              <p className="text-sm text-red-500">{duplicateState.error}</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 space-y-3 border-t border-border px-6 pb-8 pt-3">
        {isEdit && canEdit ? (
          confirmDelete ? (
            <div className="space-y-2">
              <p className="text-center text-sm text-gray-500">
                {dictionary.planner.deleteStopConfirm}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => setConfirmDelete(false)}
                >
                  {dictionary.planner.deleteKeep}
                </Button>
                <form
                  action={
                    accessMode === "guest"
                      ? deleteGuestStopAction
                      : deleteStopAction
                  }
                  className="flex-1"
                >
                  <input type="hidden" name="tripId" value={tripId} />
                  <input type="hidden" name="stopId" value={stop._id} />
                  <input type="hidden" name="returnTo" value={deleteReturnTo} />
                  <SubmitButton
                    variant="destructive"
                    className="h-11 w-full rounded-xl"
                    pendingLabel={dictionary.planner.deleting}
                  >
                    {dictionary.planner.deleteConfirm}
                  </SubmitButton>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3">
                <Link
                  href={viewHref}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {dictionary.planner.cancel}
                </Link>
                <SubmitButton
                  form="stop-update-form"
                  className="h-11 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  pendingLabel={dictionary.planner.saving}
                >
                  {dictionary.planner.saveChanges}
                </SubmitButton>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full gap-2 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" /> {dictionary.planner.deleteStop}
              </Button>
            </div>
          )
        ) : (
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => prevHref && router.push(prevHref)}
              disabled={!prevHref}
              className="flex w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={dictionary.planner.previousStop}
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="flex-1 space-y-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="h-11 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                  <ExternalLink className="h-4 w-4" />{" "}
                  {dictionary.planner.openInGoogleMaps}
                </Button>
              </a>
              <div className="flex gap-2">
                {canEdit ? (
                  <>
                    <Link
                      href={editHref}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Edit2 className="h-4 w-4" /> {dictionary.planner.edit}
                    </Link>
                    {canVisitAgain ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 gap-2 rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                        onClick={() => {
                          setNewVisitDate("");
                          setNewVisitTime("");
                          setShowVisitAgain(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />{" "}
                        {dictionary.planner.visitAgain}
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => nextHref && router.push(nextHref)}
              disabled={!nextHref}
              className="flex w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={dictionary.planner.nextStop}
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {showVisitAgain && canEdit ? (
        <div className="absolute inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowVisitAgain(false)}
          />
          <form
            action={duplicateFormAction}
            className="relative z-10 mx-4 w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 text-card-foreground shadow-2xl"
          >
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="stopId" value={stop._id} />
            <input type="hidden" name="returnTo" value={viewHref} />
            <h3 className="text-lg font-bold text-foreground">
              {dictionary.planner.addAnotherVisit}
            </h3>
            <p className="-mt-1 text-sm text-muted-foreground">{stop.name}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">
                  {dictionary.planner.date}
                </Label>
                <input type="hidden" name="date" value={newVisitDate} />
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  <Calendar
                    mode="single"
                    selected={visitAgainDate}
                    defaultMonth={visitAgainDate ?? defaultTripMonth}
                    onSelect={(nextDate) => {
                      if (!nextDate) {
                        setNewVisitDate("");
                        return;
                      }

                      setNewVisitDate(format(nextDate, "yyyy-MM-dd"));
                    }}
                    modifiers={{ highlighted: highlightedTripDates }}
                    modifiersClassNames={{
                      highlighted:
                        "bg-emerald-500/15 font-semibold text-emerald-900 dark:text-emerald-100",
                    }}
                    className="mx-auto"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">
                  {dictionary.planner.timeOptional}
                </Label>
                <TimePicker value={newVisitTime} onChange={setNewVisitTime} />
                <input type="hidden" name="time" value={newVisitTime} />
                <p className="text-[11px] text-gray-400">
                  {dictionary.planner.timeOptionalWhenDate}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                onClick={() => setShowVisitAgain(false)}
              >
                {dictionary.planner.cancel}
              </Button>
              <SubmitButton
                className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!newVisitDate}
                pendingLabel={dictionary.planner.adding}
              >
                {dictionary.planner.add}
              </SubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
