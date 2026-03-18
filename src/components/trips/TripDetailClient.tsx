"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Users, DollarSign, Map, Trash2, ChevronDown, ChevronUp, Archive, ArchiveRestore, Share2, Copy, Check, FileText, Plus, ExternalLink, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Member = { userId: string; name: string; email: string; image: string; isOwner: boolean };
type Doc = { _id: string; name: string; url: string };
type Props = {
  trip: {
    _id: string; name: string; description: string; centerName: string;
    shareCode: string; role: string; userId: string; status: string;
    documents: Doc[];
  };
  members: Member[];
  totalExpense: number;
  currentUserId: string;
};

export default function TripDetailClient({ trip, members, totalExpense, currentUserId }: Props) {
  const router = useRouter();
  const [memberList, setMemberList] = useState<Member[]>(members);
  const [tripStatus, setTripStatus] = useState(trip.status);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddDocDialog, setShowAddDocDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docs, setDocs] = useState<Doc[]>(trip.documents ?? []);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);
  const isOwner = currentUserId === trip.userId;
  const isArchived = tripStatus === "archived";

  async function handleRemoveMember(memberId: string) {
    try {
      const res = await fetch(`/api/trips/${trip._id}/members/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      setMemberList(prev => prev.filter(m => m.userId !== memberId));
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function handleArchive() {
    const newStatus = tripStatus === "active" ? "archived" : "active";
    try {
      const res = await fetch(`/api/trips/${trip._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      setTripStatus(newStatus);
      toast.success(newStatus === "archived" ? "Trip archived" : "Trip restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update trip status");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(trip.shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${trip._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Trip deleted");
      router.push("/trips");
    } catch {
      toast.error("Failed to delete trip");
      setDeleting(false);
    }
  }

  async function handleAddDoc() {
    if (!docName.trim() || !docUrl.trim()) return;
    if (!docUrl.includes("google.com")) {
      toast.error("URL must be a Google link (must contain google.com)");
      return;
    }
    setAddingDoc(true);
    try {
      const res = await fetch(`/api/trips/${trip._id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: docName.trim(), url: docUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error");
      }
      const updated: Doc[] = await res.json();
      setDocs(updated);
      setDocName(""); setDocUrl("");
      setShowAddDocDialog(false);
      toast.success("Document added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add document");
    } finally {
      setAddingDoc(false);
    }
  }

  async function handleRemoveDoc(docId: string) {
    try {
      const res = await fetch(`/api/trips/${trip._id}/documents?docId=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocs(prev => prev.filter(d => d._id !== docId));
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 md:pt-16">
      <div className="bg-blue-600 text-white px-4 pb-8 md:pt-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push("/trips")} className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> All Trips
            </button>
            <button
              onClick={() => setShowShareDialog(true)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            {isArchived && (
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 text-xs">Archived</Badge>
            )}
          </div>
          {trip.description && <p className="text-blue-200 mt-1 text-sm">{trip.description}</p>}
          {trip.centerName && (
            <div className="flex items-center gap-1.5 mt-2 text-blue-200 text-sm">
              <MapPin className="w-3.5 h-3.5" /> {trip.centerName}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="w-3.5 h-3.5" /> Members</div>
            <p className="text-2xl font-bold text-foreground">{memberList.length}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="w-3.5 h-3.5" /> Total Expenses</div>
            <p className="text-2xl font-bold text-foreground">CAD {totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Members collapsible */}
        <Collapsible open={membersOpen} onOpenChange={setMembersOpen} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" /> Trip Members
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-full font-medium">{memberList.length}</span>
            </span>
            {membersOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border divide-y divide-border">
              {memberList.map(m => (
                <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={m.image} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                      {m.name?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{m.name}</p>
                    <p className="text-muted-foreground text-xs truncate">{m.email}</p>
                  </div>
                  {m.isOwner && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Owner</Badge>}
                  {isOwner && !m.isOwner && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 text-muted-foreground/60 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-2 flex-col gap-1 text-xs font-semibold"
            onClick={() => router.push(`/plan/${trip._id}`)}
          >
            <Map className="w-5 h-5" />
            View Plan
          </Button>
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-2 flex-col gap-1 text-xs font-semibold"
            onClick={() => router.push(`/expense/${trip._id}`)}
          >
            <DollarSign className="w-5 h-5" />
            View Expenses
          </Button>
        </div>

        {/* Documents collapsible */}
        <Collapsible open={docsOpen} onOpenChange={setDocsOpen} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-muted-foreground" /> Documents
              {docs.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-full font-medium">{docs.length}</span>
              )}
            </span>
            {docsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border">
              {docs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No documents linked yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {docs.map(doc => (
                    <div key={doc._id} className="flex items-center gap-3 px-4 py-3">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 group">
                        <p className="text-sm font-medium text-foreground group-hover:text-blue-500 truncate transition-colors">{doc.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.url}</p>
                      </a>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground/60 hover:text-blue-500 transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {!isArchived && (
                        <button onClick={() => handleRemoveDoc(doc._id)}
                          className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!isArchived && (
                <div className="px-4 py-3 border-t border-border">
                  <button onClick={() => setShowAddDocDialog(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Add document
                  </button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Danger Zone — owner only */}
        {isOwner && (
          <Collapsible open={dangerOpen} onOpenChange={setDangerOpen} className="rounded-2xl border border-red-200 overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <span className="text-sm font-semibold">Danger Zone</span>
              {dangerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-card divide-y divide-border">
                <button
                  onClick={handleArchive}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  {tripStatus === "active" ? (
                    <>
                      <Archive className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Archive trip</p>
                        <p className="text-xs text-muted-foreground">Hides it from active list. Stops and expenses are locked.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Restore trip</p>
                        <p className="text-xs text-muted-foreground">Move back to active list.</p>
                      </div>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-600">Delete trip</p>
                    <p className="text-xs text-red-400">Permanently deletes all stops and expenses.</p>
                  </div>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle>Share Trip</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Share this code so others can request to join <strong>{trip.name}</strong>.</p>
          <div className="flex items-center justify-between bg-muted rounded-2xl px-5 py-4 mt-2">
            <span className="text-3xl font-mono font-bold tracking-widest text-foreground">{trip.shareCode}</span>
            <button onClick={handleCopy} className="p-2 rounded-xl hover:bg-muted-foreground/20 transition-colors text-muted-foreground">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl" variant="outline" onClick={() => setShowShareDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle>Delete Trip?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This will permanently delete <strong>{trip.name}</strong> and all its stops and expenses. This cannot be undone.</p>
          <DialogFooter className="gap-2 flex-row mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add document dialog */}
      <Dialog open={showAddDocDialog} onOpenChange={open => { setShowAddDocDialog(open); if (!open) { setDocName(""); setDocUrl(""); } }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Paste a Google Drive or Google Docs share link.</p>
          <div className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Itinerary Draft"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Link</Label>
              <Input
                placeholder="https://docs.google.com/..."
                value={docUrl}
                onChange={e => setDocUrl(e.target.value)}
                className="rounded-xl h-11"
              />
              {docUrl && !docUrl.includes("google.com") && (
                <p className="text-xs text-red-500">URL must be a Google link</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddDocDialog(false)}>Cancel</Button>
            <Button
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={handleAddDoc}
              disabled={addingDoc || !docName.trim() || !docUrl.trim() || !docUrl.includes("google.com")}
            >
              {addingDoc ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
