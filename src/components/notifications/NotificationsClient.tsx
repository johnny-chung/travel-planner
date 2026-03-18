"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, RefreshCw, Check, X, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Notification = {
  planId: string;
  planName: string;
  userId: string;
  name: string;
  email: string;
  requestedAt: string;
};

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleApprove(planId: string, userId: string) {
    setActionLoading(`approve-${planId}-${userId}`);
    try {
      const res = await fetch(`/api/trips/${planId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.error === "LIMIT_REACHED") {
          setUpgradeMessage(data.message ?? "Upgrade to Pro to approve more collaborators.");
          setShowUpgradeDialog(true);
          return;
        }
        throw new Error(data.error ?? "Failed");
      }
      toast.success("Request approved");
      setNotifications(prev => prev.filter(n => !(n.planId === planId && n.userId === userId)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeny(planId: string, userId: string) {
    setActionLoading(`deny-${planId}-${userId}`);
    try {
      const res = await fetch(`/api/trips/${planId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Request denied");
      setNotifications(prev => prev.filter(n => !(n.planId === planId && n.userId === userId)));
    } catch {
      toast.error("Failed to deny request");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0 md:pt-16">
      <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-400 mt-0.5">Pending join requests for your plans</p>
          </div>
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-700 text-lg">No pending requests</h3>
            <p className="text-gray-400 text-sm mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const key = `${n.planId}-${n.userId}`;
              const approving = actionLoading === `approve-${n.planId}-${n.userId}`;
              const denying = actionLoading === `deny-${n.planId}-${n.userId}`;
              return (
                <div key={key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{n.name || n.userId}</p>
                      {n.email && <p className="text-gray-400 text-xs truncate">{n.email}</p>}
                      <p className="text-gray-500 text-xs mt-0.5">
                        Wants to join <span className="font-medium text-gray-700">{n.planName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold gap-1.5"
                      onClick={() => handleApprove(n.planId, n.userId)}
                      disabled={approving || denying}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {approving ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-9 rounded-xl text-red-500 border-red-200 hover:bg-red-50 text-xs font-semibold gap-1.5"
                      onClick={() => handleDeny(n.planId, n.userId)}
                      disabled={approving || denying}
                    >
                      <X className="w-3.5 h-3.5" />
                      {denying ? "Denying..." : "Deny"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-5 h-5 text-amber-500" /> Upgrade to Pro
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 text-sm">{upgradeMessage}</p>
          <DialogFooter className="gap-2 flex-col sm:flex-col mt-2">
            <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => { setShowUpgradeDialog(false); window.location.href = "/upgrade"; }}>
              Upgrade to Pro
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}