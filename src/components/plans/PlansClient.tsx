"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, Map, ChevronRight, Share2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import LocationSearchInput from "@/components/plans/LocationSearchInput";
import { format } from "date-fns";

type Plan = {
  _id: string;
  name: string;
  description: string;
  centerName: string;
  centerLat: number | null;
  centerLng: number | null;
  createdAt: string;
  role: 'owner' | 'editor' | 'pending';
  shareCode?: string;
};

type Props = {
  initialPlans: Plan[];
  user: { name: string; image: string };
  googleMapsApiKey: string;
};

export default function PlansClient({ initialPlans, user: _user, googleMapsApiKey }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareDialogPlanId, setShareDialogPlanId] = useState<string | null>(null);

  const sharePlan = plans.find(p => p._id === shareDialogPlanId);

  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/plans");
      if (!res.ok) return;
      const data = await res.json();
      setPlans(data.map((p: Record<string, unknown>) => ({
        _id: String(p._id),
        name: p.name as string,
        description: (p.description ?? "") as string,
        centerName: (p.centerName ?? "") as string,
        centerLat: (p.centerLat ?? null) as number | null,
        centerLng: (p.centerLng ?? null) as number | null,
        createdAt: p.createdAt as string ?? new Date().toISOString(),
        role: (p.role ?? 'owner') as 'owner' | 'editor' | 'pending',
        shareCode: (p.shareCode ?? "") as string,
      })));
    } catch {
      toast.error("Failed to refresh plans");
    }
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, location, locationLat, locationLng }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "API error");
      }
      const created = await res.json();
      setPlans((prev) => [{
        _id: String(created._id),
        name: created.name,
        description: created.description ?? "",
        centerName: created.centerName ?? "",
        centerLat: created.centerLat ?? null,
        centerLng: created.centerLng ?? null,
        createdAt: created.createdAt ?? new Date().toISOString(),
        role: 'owner',
        shareCode: created.shareCode ?? "",
      }, ...prev]);
      setShowCreate(false);
      resetCreateForm();
      toast.success("Plan created!");
    } catch (err) {
      console.error("handleCreate error:", err);
      toast.error("Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  async function joinPlan() {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/plans/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode: joinCode }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "API error");
      toast.success(`Request sent to join "${body.planName}"!`);
      setShowCreate(false);
      resetCreateForm();
      await handleRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join plan";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function resetCreateForm() {
    setName(""); setDescription(""); setLocation("");
    setLocationLat(null); setLocationLng(null); setJoinCode("");
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPlans((prev) => prev.filter((p) => p._id !== id));
      setDeleteId(null);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  }

  const isJoining = joinCode.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0 md:pt-16">
      {/* Page header */}
      <div className="px-4 pt-6 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Plans</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {plans.length} plan{plans.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hidden md:flex"
              aria-label="Refresh plans"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Button
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 gap-2 font-semibold hidden md:flex"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" /> New Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Plans list */}
      <div className="flex-1 px-4 max-w-4xl mx-auto w-full pb-4">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mb-4">
              <Map className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-700 text-lg">No plans yet</h3>
            <p className="text-gray-400 text-sm mt-1">Create your first travel plan to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 transition-transform hover:shadow-md ${
                  plan.role === 'pending'
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer active:scale-[0.98]'
                }`}
                onClick={() => {
                  if (plan.role !== 'pending') router.push(`/plans/${plan._id}`);
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Map className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">{plan.name}</h3>
                    {plan.role === 'pending' && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Pending
                      </span>
                    )}
                    {plan.role === 'editor' && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Editor
                      </span>
                    )}
                  </div>
                  {plan.centerName ? (
                    <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {plan.centerName}
                    </p>
                  ) : plan.description ? (
                    <p className="text-gray-400 text-sm truncate">{plan.description}</p>
                  ) : null}
                  <p className="text-gray-300 text-xs mt-0.5">
                    {format(new Date(plan.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {plan.role !== 'pending' && (
                    <button
                      className="p-2 text-gray-300 hover:text-blue-400 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setShareDialogPlanId(plan._id); }}
                      aria-label="Share plan"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  {plan.role === 'owner' && (
                    <button
                      className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(plan._id); }}
                      aria-label="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Button
          className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl p-0"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Create / Join Plan Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">New Travel Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Join by code */}
            <div className="space-y-2">
              <Label>Join existing plan by code</Label>
              <div className="relative">
                <Input
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="rounded-xl h-11 pr-8 font-mono tracking-widest"
                  maxLength={6}
                />
                {joinCode && (
                  <button
                    type="button"
                    onClick={() => setJoinCode("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {!isJoining && (
              <>
                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="px-3 text-xs text-gray-400 bg-white">or create new</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <div className="space-y-2">
                  <Label>Plan Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Japan Spring 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-11"
                    disabled={isJoining}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Starting Location{" "}
                    <span className="text-gray-400 text-xs">(optional — centers the map)</span>
                  </Label>
                  <LocationSearchInput
                    value={location}
                    onChange={(text: string) => {
                      setLocation(text);
                      setLocationLat(null);
                      setLocationLng(null);
                    }}
                    onSelect={(loc: { name: string; lat: number; lng: number }) => {
                      setLocation(loc.name);
                      setLocationLat(loc.lat);
                      setLocationLng(loc.lng);
                    }}
                    apiKey={googleMapsApiKey}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <Textarea
                    placeholder="What's this trip about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={2}
                    disabled={isJoining}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 flex-row">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowCreate(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={isJoining ? joinPlan : handleCreate}
              disabled={loading || (isJoining ? !joinCode.trim() : !name.trim())}
            >
              {loading ? (isJoining ? "Joining..." : "Creating...") : (isJoining ? "Join Plan" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!shareDialogPlanId} onOpenChange={() => setShareDialogPlanId(null)}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Share Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            <p className="text-gray-500 text-sm text-center">
              Share this code so others can join <span className="font-semibold text-gray-700">{sharePlan?.name}</span>
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-5">
              <p className="text-4xl font-mono font-bold tracking-widest text-gray-900 text-center">
                {sharePlan?.shareCode ?? "—"}
              </p>
            </div>
            <Button
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (sharePlan?.shareCode) {
                  navigator.clipboard.writeText(sharePlan.shareCode);
                  toast.success("Code copied to clipboard!");
                }
              }}
            >
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 text-sm">This will permanently delete the plan and all its stops.</p>
          <DialogFooter className="gap-2 flex-row mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}