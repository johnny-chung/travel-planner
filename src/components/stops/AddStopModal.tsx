"use client";

import { useState } from "react";
import { MapPin, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import TimePicker from "@/components/ui/TimePicker";
import type { TripDoc } from "@/components/map/PlanMapClient";

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
  location: Location;
  tripDocs?: TripDoc[];
  onSave: (data: { date: string; time: string; notes: string; linkedDocIds: string[] }) => void;
  onCancel: () => void;
};

export default function AddStopModal({ location, tripDocs = [], onSave, onCancel }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedDocIds, setLinkedDocIds] = useState<string[]>([]);
  const [docsOpen, setDocsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValid = date && time;

  function toggleDoc(id: string) {
    setLinkedDocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    await onSave({ date, time, notes, linkedDocIds });
    setSaving(false);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
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
            <button onClick={onCancel} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 ml-2 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Time <span className="text-red-500">*</span>
              </Label>
              <TimePicker value={time} onChange={setTime} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
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
        </div>

        <div className="flex-shrink-0 flex gap-3 px-6 pt-3 pb-8 border-t border-gray-100">
          <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? "Saving..." : "Save Stop"}
          </Button>
        </div>
      </div>
    </div>
  );
}