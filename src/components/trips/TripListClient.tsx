"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map, MapPin, Plus, ChevronRight, Share2, RefreshCw, Copy, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import LocationSearchInput from "@/components/plans/LocationSearchInput";

export type Trip = {
  _id: string; name: string; description: string; centerName: string;
  centerLat: number | null; centerLng: number | null; createdAt: string;
  role: "owner" | "editor" | "pending"; shareCode?: string;
  status?: string;
};

type Props = {
  initialTrips: Trip[];
  user: { name: string; image: string };
  googleMapsApiKey: string;
  pageTitle: string;
  onCardClick: (tripId: string) => void;
  showCreate?: boolean;
};

export default function TripListClient({ initialTrips, user: _user, googleMapsApiKey, pageTitle, onCardClick, showCreate = true }: Props) {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate_, setShowCreate_] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [copied, setCopied] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [rentCar, setRentCar] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/trips");
      const data = await res.json();
      if (Array.isArray(data)) setTrips(data.filter((p: Trip) => p.status !== 'deleted').map((p: Trip) => ({
        _id: String(p._id), name: p.name, description: p.description ?? "",
        centerName: p.centerName ?? "", centerLat: p.centerLat ?? null, centerLng: p.centerLng ?? null,
        createdAt: p.createdAt ?? "", role: p.role, shareCode: p.shareCode ?? "",
        status: p.status ?? "active",
      })));
    } catch { toast.error("Refresh failed"); }
    finally { setRefreshing(false); }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, location, locationLat, locationLng, transportMode: rentCar ? 'drive' : 'transit' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.error === 'LIMIT_REACHED') {
          setUpgradeMessage(data.message ?? "Upgrade to Pro for unlimited trips.");
          setShowCreate_(false);
          setShowUpgradeDialog(true);
          return;
        }
        throw new Error(data.detail ?? data.error ?? "Error");
      }
      setTrips(prev => [{
        _id: String(data._id), name: data.name, description: data.description ?? "",
        centerName: data.centerName ?? "", centerLat: data.centerLat ?? null,
        centerLng: data.centerLng ?? null, createdAt: data.createdAt ?? new Date().toISOString(),
        role: "owner", shareCode: data.shareCode ?? "", status: data.status ?? "active",
      }, ...prev]);
      setShowCreate_(false); setName(""); setDescription(""); setLocation(""); setLocationLat(null); setLocationLng(null); setRentCar(false);
      toast.success("Trip created!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create trip"); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/trips/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.error === 'LIMIT_REACHED') {
          setUpgradeMessage(data.message ?? "Upgrade to Pro for unlimited trips.");
          setShowCreate_(false);
          setShowUpgradeDialog(true);
          return;
        }
        throw new Error(data.error ?? "Error");
      }
      toast.success(`Join request sent for "${data.planName}"!`);
      setShowCreate_(false); setJoinCode("");
      handleRefresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to join"); }
    finally { setLoading(false); }
  }

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPending = (t: Trip) => t.role === "pending";
  const canShare = (t: Trip) => t.role === "owner" || t.role === "editor";

  const visibleTrips = trips.filter(t => t.status !== 'deleted');
  const activeTrips = visibleTrips.filter(t => t.status !== 'archived');
  const archivedTrips = visibleTrips.filter(t => t.status === 'archived');

  void router;

  function TripCard({ trip }: { trip: Trip }) {
    return (
      <div
        key={trip._id}
        className={`bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 transition-all
          ${isPending(trip) ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.98] hover:shadow-md"}`}
        onClick={() => !isPending(trip) && onCardClick(trip._id)}
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <Map className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground truncate max-w-[140px]">{trip.name}</h3>
            {trip.role === "editor" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Editor</Badge>}
            {trip.role === "pending" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-yellow-600 border-yellow-300">Pending</Badge>}
            {trip.status === "archived" && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Archived</Badge>}
          </div>
          {trip.centerName ? (
            <p className="text-muted-foreground text-sm truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />{trip.centerName}
            </p>
          ) : trip.description ? (
            <p className="text-muted-foreground text-sm truncate mt-0.5">{trip.description}</p>
          ) : null}
          <p className="text-muted-foreground/60 text-xs mt-0.5">{format(new Date(trip.createdAt), "MMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canShare(trip) && (
            <button className="p-2 text-muted-foreground/60 hover:text-blue-500 transition-colors" onClick={(e) => { e.stopPropagation(); setShareTrip(trip); setCopied(false); }}>
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {!isPending(trip) && <ChevronRight className="w-4 h-4 text-muted-foreground/60" />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pt-16">
      <div className="px-4 pt-6 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{activeTrips.filter(t => !isPending(t)).length} trip{activeTrips.filter(t => !isPending(t)).length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {showCreate && (
              <Button className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold hidden md:flex" onClick={() => setShowCreate_(true)}>
                <Plus className="w-4 h-4" /> New Trip
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto w-full pb-4 space-y-4">
        {activeTrips.length === 0 && archivedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Map className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">No trips yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first trip to get started</p>
          </div>
        ) : (
          <>
            {activeTrips.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeTrips.map((trip) => <TripCard key={trip._id} trip={trip} />)}
              </div>
            )}

            {archivedTrips.length > 0 && (
              <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
                  {archivedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Archived Trips ({archivedTrips.length})
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {archivedTrips.map((trip) => <TripCard key={trip._id} trip={trip} />)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <Button className="w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl p-0" onClick={() => setShowCreate_(true)}>
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* New Trip / Join Dialog */}
      <Dialog open={showCreate_} onOpenChange={(o) => { setShowCreate_(o); if (!o) { setJoinCode(""); setName(""); setDescription(""); setLocation(""); setRentCar(false); } }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle className="text-xl">New Trip</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Join existing trip</Label>
              <div className="relative">
                <Input
                  placeholder="6-letter code e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="rounded-xl h-11 uppercase tracking-widest font-mono pr-8"
                />
                {joinCode && (
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setJoinCode("")}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {joinCode.length > 0 && <p className="text-xs text-blue-600">Enter code to request access — other fields disabled</p>}
            </div>

            {joinCode.length === 0 && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs"><div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" /></div>
                <div className="space-y-2">
                  <Label>Trip Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Japan Spring 2025" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-11" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Starting Location <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <LocationSearchInput
                    value={location}
                    onChange={(text: string) => { setLocation(text); setLocationLat(null); setLocationLng(null); }}
                    onSelect={(loc: { name: string; lat: number; lng: number }) => { setLocation(loc.name); setLocationLat(loc.lat); setLocationLng(loc.lng); }}
                    apiKey={googleMapsApiKey}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <Textarea placeholder="What's this trip about?" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl resize-none" rows={2} />
                </div>
                <div className="flex items-center gap-3 py-1">
                  <button
                    type="button"
                    onClick={() => setRentCar(v => !v)}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${rentCar ? "bg-blue-500" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rentCar ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm text-foreground">🚗 Will you rent a car? <span className="text-muted-foreground text-xs">(sets default to Drive mode)</span></span>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 flex-row">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowCreate_(false); setJoinCode(""); }}>Cancel</Button>
            {joinCode.length > 0 ? (
              <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleJoin} disabled={loading || joinCode.length < 4}>{loading ? "Sending..." : "Request Access"}</Button>
            ) : (
              <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCreate} disabled={loading || !name.trim()}>{loading ? "Creating..." : "Create"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!shareTrip} onOpenChange={() => setShareTrip(null)}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle>Share Trip</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Share this code so others can request to join <strong>{shareTrip?.name}</strong>.</p>
          <div className="flex items-center justify-between bg-muted rounded-2xl px-5 py-4 mt-2">
            <span className="text-3xl font-mono font-bold tracking-widest text-foreground">{shareTrip?.shareCode}</span>
            <button onClick={() => shareTrip?.shareCode && handleCopy(shareTrip.shareCode)} className="p-2 rounded-xl hover:bg-muted-foreground/20 transition-colors text-muted-foreground">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <DialogFooter><Button className="w-full rounded-xl" variant="outline" onClick={() => setShareTrip(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Trip Limit Reached</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your <span className="font-semibold text-foreground">Basic plan</span> includes{" "}
              <span className="font-semibold">1 active trip</span> and{" "}
              <span className="font-semibold">1 archived trip</span>. To create a new trip, consider one of the following options:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500 font-bold shrink-0">①</span>
                <span><span className="font-medium text-foreground">Upgrade to Pro</span> — enjoy unlimited trips, collaborators, and navigation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-muted-foreground/60 font-bold shrink-0">②</span>
                <span><span className="font-medium text-foreground">Archive an existing trip</span> — archived trips don&apos;t count toward your active limit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-muted-foreground/60 font-bold shrink-0">③</span>
                <span><span className="font-medium text-foreground">Delete a trip</span> — permanently remove a trip you no longer need.</span>
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-col mt-1">
            <Button
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => { setShowUpgradeDialog(false); window.location.href = "/upgrade"; }}
            >
              Upgrade to Pro
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => { setShowUpgradeDialog(false); }}
            >
              Manage My Trips
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
