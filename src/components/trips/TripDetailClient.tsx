"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Map, MapPin, Share2 } from "lucide-react";
import SignupGateDialog from "@/components/auth/SignupGateDialog";
import ShareCodeDialog from "@/components/shared/ShareCodeDialog";
import AddTripDocumentDialog from "@/components/trips/detail/AddTripDocumentDialog";
import AddStayDialog from "@/components/trips/detail/AddStayDialog";
import AddTransportDialog from "@/components/trips/detail/AddTransportDialog";
import TripDangerZone from "@/components/trips/detail/TripDangerZone";
import TripDocumentsCard from "@/components/trips/detail/TripDocumentsCard";
import TripMembersCard from "@/components/trips/detail/TripMembersCard";
import TripStayCard from "@/components/trips/detail/TripStayCard";
import TripTransportCard from "@/components/trips/detail/TripTransportCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
};

export default function TripDetailClient({
  trip,
  members,
  currentUserId,
  googleMapsApiKey,
  backHref = "/trips",
  planHref,
  expenseHref,
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

  const isOwner = currentUserId === trip.userId;
  const isArchived = trip.status === "archived";
  const resolvedPlanHref = planHref ?? `/trips/${trip._id}/plan`;
  const resolvedExpenseHref = expenseHref ?? `/trips/${trip._id}/expense`;

  function openRestrictedFeature() {
    setShowSignupGate(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 md:pt-16">
      <div
        className="relative overflow-hidden text-[#fff7ea] px-4 pb-8 md:pt-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        {trip.centerThumbnail ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${trip.centerThumbnail}")` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(49,28,16,0.6)_0%,rgba(69,40,22,0.78)_55%,rgba(93,57,33,0.86)_100%)]" />
        {!trip.centerThumbnail ? (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#6d4323_0%,#8b562d_100%)]" />
        ) : null}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={backHref}
              className="flex items-center gap-1 text-[#f3ddbf] hover:text-white text-sm transition-colors"
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
                className="flex items-center gap-1.5 text-[#f3ddbf] hover:text-white text-sm transition-colors"
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
          {trip.description ? <p className="mt-1 text-sm text-[#f3ddbf]">{trip.description}</p> : null}
          {trip.centerName ? (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-[#f3ddbf]">
              <MapPin className="w-3.5 h-3.5" /> {trip.centerName}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={resolvedPlanHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-16 rounded-2xl border-2 flex-col gap-1.5 text-sm font-semibold",
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
                "h-16 rounded-2xl border-2 flex-col gap-1.5 text-sm font-semibold",
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
                "h-16 rounded-2xl border-2 flex-col gap-1.5 text-sm font-semibold",
              )}
            >
              <DollarSign className="w-5 h-5" />
              View Expenses
            </button>
          )}
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
          open={stayOpen}
          onOpenChange={setStayOpen}
          onAddStay={() => {
            if (trip.capabilities.canManageStay) {
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
          tripId={trip._id}
          apiKey={googleMapsApiKey}
          open={showAddTransportDialog}
          onOpenChange={setShowAddTransportDialog}
        />
      ) : null}

      {trip.capabilities.canManageStay ? (
        <AddStayDialog
          tripId={trip._id}
          apiKey={googleMapsApiKey}
          open={showAddStayDialog}
          onOpenChange={setShowAddStayDialog}
        />
      ) : null}

      <SignupGateDialog open={showSignupGate} onOpenChange={setShowSignupGate} />
    </div>
  );
}
