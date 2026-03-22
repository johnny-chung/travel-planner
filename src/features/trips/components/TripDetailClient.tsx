"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, ListChecks, Map, MapPin, Share2 } from "lucide-react";
import SignupGateDialog from "@/features/shared/components/SignupGateDialog";
import ShareCodeDialog from "@/features/shared/components/ShareCodeDialog";
import AddTripDocumentDialog from "@/features/trips/components/detail/AddTripDocumentDialog";
import AddStayDialog from "@/features/trips/components/detail/AddStayDialog";
import AddTransportDialog from "@/features/trips/components/detail/AddTransportDialog";
import TripDangerZone from "@/features/trips/components/detail/TripDangerZone";
import TripDocumentsCard from "@/features/trips/components/detail/TripDocumentsCard";
import TripMembersCard from "@/features/trips/components/detail/TripMembersCard";
import TripStayCard from "@/features/trips/components/detail/TripStayCard";
import TripTransportCard from "@/features/trips/components/detail/TripTransportCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TripStayItem, TripTransportItem } from "@/types/trip-logistics";
import type { TripDetail, TripMember } from "@/types/travel";

type Props = {
  trip: TripDetail;
  members: TripMember[];
  totalExpense: number;
  currentUserId: string;
  googleMapsApiKey: string;
  backHref?: string;
  planHref?: string;
  expenseHref?: string;
  checklistHref?: string;
  accessMode?: "user" | "guest";
};

export default function TripDetailClient({
  trip,
  members,
  currentUserId,
  googleMapsApiKey,
  backHref = "/trips",
  planHref,
  expenseHref,
  checklistHref,
  accessMode = "user",
}: Props) {
  const [membersOpen, setMembersOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(true);
  const [stayOpen, setStayOpen] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showAddTransportDialog, setShowAddTransportDialog] = useState(false);
  const [showAddStayDialog, setShowAddStayDialog] = useState(false);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<TripTransportItem | null>(null);
  const [selectedStay, setSelectedStay] = useState<TripStayItem | null>(null);

  const isOwner = currentUserId === trip.userId;
  const isArchived = trip.status === "archived";
  const showJapanTransitNotice = trip.centerCountryCode === "JP";
  const resolvedPlanHref = planHref ?? `/trips/${trip._id}/plan`;
  const resolvedExpenseHref = expenseHref ?? `/trips/${trip._id}/expense`;
  const resolvedChecklistHref = checklistHref ?? `/trips/${trip._id}/checklist`;

  function openRestrictedFeature() {
    setShowSignupGate(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 md:pt-16">
      <div
        className="relative overflow-hidden px-4 pb-8 text-primary-foreground md:pt-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        {trip.centerThumbnail ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${trip.centerThumbnail}")` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,26,23,0.56)_0%,rgba(29,46,40,0.76)_55%,rgba(39,64,56,0.86)_100%)]" />
        {!trip.centerThumbnail ? (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c2421_0%,#2f6e62_100%)]" />
        ) : null}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> All Trips
            </Link>
            {!isArchived ? (
              <button
                type="button"
                onClick={() => {
                  if (trip.capabilities.canCollaborate) {
                    setShowShareDialog(true);
                    return;
                  }
                  openRestrictedFeature();
                }}
                className="flex items-center gap-1.5 text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            {isArchived ? (
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 text-xs">
                Archived
              </Badge>
            ) : null}
          </div>
          {trip.description ? <p className="mt-1 text-sm text-primary-foreground/75">{trip.description}</p> : null}
          {trip.centerName ? (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-primary-foreground/75">
              <MapPin className="w-3.5 h-3.5" /> {trip.centerName}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        {showJapanTransitNotice ? (
          <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
            Transit route calculation is not available in Japan with the Google Routes API. You can still open public transit directions in Google Maps.
          </div>
        ) : null}

          <div className="grid grid-cols-3 gap-3">
          <Link
            href={resolvedPlanHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-16 rounded-lg border flex-col gap-1.5 text-sm font-semibold",
            )}
          >
            <Map className="w-5 h-5" />
            View Plan
          </Link>
          {trip.capabilities.canUseExpenses ? (
            <Link
              href={resolvedExpenseHref}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-16 rounded-lg border flex-col gap-1.5 text-sm font-semibold",
              )}
            >
              <DollarSign className="w-5 h-5" />
              View Expenses
            </Link>
          ) : (
            <button
              type="button"
              onClick={openRestrictedFeature}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-16 rounded-lg border flex-col gap-1.5 text-sm font-semibold",
              )}
            >
              <DollarSign className="w-5 h-5" />
              View Expenses
            </button>
          )}
          <Link
            href={resolvedChecklistHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-16 rounded-lg border flex-col gap-1.5 text-sm font-semibold",
            )}
          >
            <ListChecks className="w-5 h-5" />
            Checklist
          </Link>
        </div>

        <TripMembersCard
          tripId={trip._id}
          members={members}
          isOwner={isOwner}
          open={membersOpen}
          onOpenChange={setMembersOpen}
        />

        <TripTransportCard
          tripId={trip._id}
          items={trip.transportItems}
          isArchived={isArchived}
          canManage={trip.capabilities.canManageTransport}
          open={transportOpen}
          onOpenChange={setTransportOpen}
          onAddTransport={() => {
            if (trip.capabilities.canManageTransport) {
              setSelectedTransport(null);
              setShowAddTransportDialog(true);
              return;
            }
            openRestrictedFeature();
          }}
          onEditTransport={(item) => {
            if (trip.capabilities.canManageTransport) {
              setSelectedTransport(item);
              setShowAddTransportDialog(true);
              return;
            }
            openRestrictedFeature();
          }}
        />

        <TripStayCard
          tripId={trip._id}
          items={trip.stayItems}
          isArchived={isArchived}
          canManage={trip.capabilities.canManageStay}
          accessMode={accessMode}
          open={stayOpen}
          onOpenChange={setStayOpen}
          onAddStay={() => {
            if (trip.capabilities.canManageStay) {
              setSelectedStay(null);
              setShowAddStayDialog(true);
              return;
            }
            openRestrictedFeature();
          }}
          onEditStay={(item) => {
            if (trip.capabilities.canManageStay) {
              setSelectedStay(item);
              setShowAddStayDialog(true);
              return;
            }
            openRestrictedFeature();
          }}
        />

        <TripDocumentsCard
          tripId={trip._id}
          documents={trip.documents}
          isArchived={isArchived}
          canManage={trip.capabilities.canManageDocuments}
          open={documentsOpen}
          onOpenChange={setDocumentsOpen}
          onAddDocument={() => {
            if (trip.capabilities.canManageDocuments) {
              setShowAddDocumentDialog(true);
              return;
            }
            openRestrictedFeature();
          }}
        />

        {isOwner && !trip.capabilities.isGuest ? (
          <TripDangerZone tripId={trip._id} tripName={trip.name} status={trip.status} />
        ) : null}
      </div>

      {!isArchived && trip.capabilities.canCollaborate ? (
        <ShareCodeDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          title="Share Trip"
          description={`Share this code so others can request to join ${trip.name}.`}
          shareCode={trip.shareCode}
        />
      ) : null}

      {trip.capabilities.canManageDocuments ? (
        <AddTripDocumentDialog
          tripId={trip._id}
          open={showAddDocumentDialog}
          onOpenChange={setShowAddDocumentDialog}
        />
      ) : null}

      {trip.capabilities.canManageTransport ? (
        <AddTransportDialog
          key={`${selectedTransport?._id ?? "new-transport"}-${showAddTransportDialog ? "open" : "closed"}`}
          tripId={trip._id}
          apiKey={googleMapsApiKey}
          open={showAddTransportDialog}
          onOpenChange={(open) => {
            setShowAddTransportDialog(open);
            if (!open) {
              setSelectedTransport(null);
            }
          }}
          initialTransport={selectedTransport}
        />
      ) : null}

      {trip.capabilities.canManageStay ? (
        <AddStayDialog
          key={`${selectedStay?._id ?? "new-stay"}-${showAddStayDialog ? "open" : "closed"}`}
          tripId={trip._id}
          apiKey={googleMapsApiKey}
          accessMode={accessMode}
          open={showAddStayDialog}
          onOpenChange={(open) => {
            setShowAddStayDialog(open);
            if (!open) {
              setSelectedStay(null);
            }
          }}
          initialStay={selectedStay}
        />
      ) : null}

      <SignupGateDialog open={showSignupGate} onOpenChange={setShowSignupGate} />
    </div>
  );
}
