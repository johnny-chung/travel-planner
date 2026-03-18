"use client";

import { useState } from "react";
import {
  MapPin, Clock, Phone, Globe, ExternalLink,
  Edit2, Trash2, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar,
  FileText, Contact, Minus, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Stop, TripDoc } from "@/components/map/PlanMapClient";
import TimePicker from "@/components/ui/TimePicker";

type Props = {
  stop: Stop;
  isEdit: boolean;
  tripDocs?: TripDoc[];
  onClose: () => void;
  onEdit: () => void;
  onSave: (data: { date: string; time: string; notes: string; linkedDocIds: string[]; arrivals?: { date: string; time: string }[] }) => void;
  onDelete: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onAddArrival?: (date: string, time: string) => void;
  onRemoveArrival?: (index: number) => void;
};

export default function StopDetailModal({ stop, isEdit, tripDocs = [], onClose, onEdit, onSave, onDelete, onPrev, onNext, hasPrev = false, hasNext = false, onAddArrival, onRemoveArrival }: Props) {
  const [date, setDate] = useState(stop.date);
  const [time, setTime] = useState(stop.time);
  const [notes, setNotes] = useState(stop.notes);
  const [linkedDocIds, setLinkedDocIds] = useState<string[]>(stop.linkedDocIds ?? []);
  const [saving, setSaving] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showVisitAgain, setShowVisitAgain] = useState(false);
  const [newArrivalDate, setNewArrivalDate] = useState("");
  const [newArrivalTime, setNewArrivalTime] = useState("");
  const [showArrivals, setShowArrivals] = useState(true);

  async function handleSave() {
    setSaving(true);
    const arrivals = stop.arrivals;
    const hasMultiple = arrivals && arrivals.length > 1;
    const arrivalIdx = stop._arrivalIndex ?? 0;
    const updatedArrivals = hasMultiple
      ? arrivals!.map((a, i) => (i === arrivalIdx ? { date, time } : a))
      : undefined;
    await onSave({ date, time, notes, linkedDocIds, ...(updatedArrivals ? { arrivals: updatedArrivals } : {}) });
    setSaving(false);
  }

  function toggleDoc(id: string) {
    setLinkedDocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const linkedDocs = tripDocs.filter(d => (stop.linkedDocIds ?? []).includes(d._id));
  const editLinkedDocs = tripDocs.filter(d => linkedDocIds.includes(d._id));

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}&query_place_id=${stop.placeId}`;

  const formattedDate = (() => {
    try { return format(new Date(stop.date + "T00:00:00"), "EEE, MMM d, yyyy"); }
    catch { return stop.date; }
  })();

  const hasContact = !!(stop.phone || stop.address);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex-shrink-0 pt-4 pb-2 px-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <span className="text-white text-xs font-bold">{stop.order}</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{stop.name}</h2>
                <p className="text-gray-400 text-sm truncate mt-0.5">{stop.address}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
          {/* Thumbnail */}
          {stop.thumbnail && (
            <div className="rounded-2xl overflow-hidden h-40 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stop.thumbnail} alt={stop.name} className="w-full h-full object-cover" />
            </div>
          )}

          {isEdit ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">Time</Label>
                  <TimePicker value={time} onChange={setTime} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl resize-none text-sm"
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>

              {/* Documents selector (edit mode) */}
              {tripDocs.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">Linked Documents</Label>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
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
                  {editLinkedDocs.length > 0 && (
                    <p className="text-xs text-blue-500">{editLinkedDocs.length} document{editLinkedDocs.length !== 1 ? "s" : ""} linked</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Arrivals section */}
              {(stop.arrivals && stop.arrivals.length > 1) ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowArrivals((v) => !v)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Arrival Times
                      <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {stop.arrivals.length}
                      </span>
                    </span>
                    {showArrivals ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {showArrivals && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {stop.arrivals.map((arrival, i) => {
                        const isCurrentArrival = i === (stop._arrivalIndex ?? 0);
                        const fmtDate = (() => {
                          try { return format(new Date(arrival.date + "T00:00:00"), "EEE, MMM d, yyyy"); }
                          catch { return arrival.date; }
                        })();
                        return (
                          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${isCurrentArrival ? "bg-blue-50" : ""}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-blue-700">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span className="text-sm font-medium">{fmtDate}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-1.5 text-blue-700">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-sm font-semibold">{arrival.time}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveArrival?.(i)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remove this arrival"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-semibold">{formattedDate}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2 text-blue-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-semibold">{stop.time}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {stop.notes && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 font-medium mb-1">NOTES</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{stop.notes}</p>
                </div>
              )}

              {/* Contact collapsible */}
              {hasContact && (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowContact(v => !v)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Contact className="w-4 h-4 text-gray-400" /> Contact
                    </span>
                    {showContact ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {showContact && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {stop.address && (
                        <div className="flex items-start gap-3 px-4 py-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700">{stop.address}</span>
                        </div>
                      )}
                      {stop.phone && (
                        <a href={`tel:${stop.phone}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{stop.phone}</span>
                        </a>
                      )}
                      {stop.website && (
                        <a href={stop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                          <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-blue-600 font-medium truncate">{stop.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Opening hours */}
              {stop.openingHours.length > 0 && (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowHours(v => !v)}
                  >
                    <span className="text-sm font-semibold text-gray-700">Opening Hours</span>
                    {showHours ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {showHours && (
                    <div className="px-4 pb-3 pt-1 space-y-1 border-t border-gray-100">
                      {stop.openingHours.map((h, i) => (
                        <p key={i} className="text-xs text-gray-500 py-0.5">{h}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Linked documents (view mode) */}
              {tripDocs.length > 0 && (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDocs(v => !v)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-gray-400" /> Documents
                      {linkedDocs.length > 0 && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">{linkedDocs.length}</span>
                      )}
                    </span>
                    {showDocs ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {showDocs && (
                    <div className="border-t border-gray-100">
                      {linkedDocs.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs py-4">No documents linked to this stop</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {linkedDocs.map(doc => (
                            <a
                              key={doc._id}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                            >
                              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate transition-colors">{doc.name}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-6 pb-8 pt-3 border-t border-gray-100 space-y-3">
          {isEdit ? (
            confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-center text-gray-500">Are you sure you want to delete this stop?</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setConfirmDelete(false)}>No, keep it</Button>
                  <Button variant="destructive" className="flex-1 rounded-xl h-11" onClick={onDelete}>Yes, delete</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={onClose}>Cancel</Button>
                  <Button
                    className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
                    onClick={handleSave}
                    disabled={saving || !date || !time}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
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
              {/* Prev button */}
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="flex flex-col items-center justify-center w-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Previous stop"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>

              {/* Centre: stacked actions */}
              <div className="flex-1 space-y-2">
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full rounded-xl h-11 bg-blue-600 hover:bg-blue-700 gap-2 font-semibold">
                    <ExternalLink className="w-4 h-4" /> Open in Google Maps
                  </Button>
                </a>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 gap-2" onClick={onEdit}>
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-10 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => { setNewArrivalDate(""); setNewArrivalTime(""); setShowVisitAgain(true); }}
                  >
                    <RefreshCw className="w-4 h-4" /> Visit Again
                  </Button>
                </div>
              </div>

              {/* Next button */}
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex flex-col items-center justify-center w-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Next stop"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visit Again dialog */}
      {showVisitAgain && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowVisitAgain(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 mx-4 w-full max-w-sm space-y-4 z-10">
            <h3 className="font-bold text-gray-900 text-lg">Add Arrival Time</h3>
            <p className="text-sm text-gray-500 -mt-1">{stop.name}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">Date</Label>
                <Input type="date" value={newArrivalDate} onChange={(e) => setNewArrivalDate(e.target.value)} className="rounded-xl h-10 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">Time</Label>
                <TimePicker value={newArrivalTime} onChange={setNewArrivalTime} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowVisitAgain(false)}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700"
                disabled={!newArrivalDate || !newArrivalTime}
                onClick={() => {
                  onAddArrival?.(newArrivalDate, newArrivalTime);
                  setShowVisitAgain(false);
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}