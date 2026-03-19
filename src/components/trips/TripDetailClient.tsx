"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Map, MapPin, Share2, Users } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TripDetail, TripMember } from "@/types/travel";

type Props = {
  trip: TripDetail;
  members: TripMember[];
  totalExpense: number;
  currentUserId: string;
  googleMapsApiKey: string;
};

export default function TripDetailClient({
  trip,
  members,
  totalExpense,
  currentUserId,
  googleMapsApiKey,
}: Props) {
  const [membersOpen, setMembersOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(true);
  const [stayOpen, setStayOpen] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showAddTransportDialog, setShowAddTransportDialog] = useState(false);
  const [showAddStayDialog, setShowAddStayDialog] = useState(false);

  const isOwner = currentUserId === trip.userId;
  const isArchived = trip.status === "archived";

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 md:pt-16">
      <div
        className="bg-blue-600 text-white px-4 pb-8 md:pt-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/trips"
              className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All Trips
            </Link>
            {!isArchived ? (
              <button
                type="button"
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition-colors"
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
          {trip.description ? <p className="text-blue-200 mt-1 text-sm">{trip.description}</p> : null}
          {trip.centerName ? (
            <div className="flex items-center gap-1.5 mt-2 text-blue-200 text-sm">
              <MapPin className="w-3.5 h-3.5" /> {trip.centerName}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="w-3.5 h-3.5" /> Members
              </div>
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" /> Total Expenses
              </div>
              <p className="text-2xl font-bold text-foreground">
                CAD {totalExpense.toFixed(2)}
              </p>
            </CardContent>
          </Card>
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
          open={transportOpen}
          onOpenChange={setTransportOpen}
          onAddTransport={() => setShowAddTransportDialog(true)}
        />

        <TripStayCard
          tripId={trip._id}
          items={trip.stayItems}
          isArchived={isArchived}
          open={stayOpen}
          onOpenChange={setStayOpen}
          onAddStay={() => setShowAddStayDialog(true)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/trips/${trip._id}/plan`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-14 rounded-2xl border-2 flex-col gap-1 text-xs font-semibold",
            )}
          >
            <Map className="w-5 h-5" />
            View Plan
          </Link>
          <Link
            href={`/trips/${trip._id}/expense`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-14 rounded-2xl border-2 flex-col gap-1 text-xs font-semibold",
            )}
          >
            <DollarSign className="w-5 h-5" />
            View Expenses
          </Link>
        </div>

        <TripDocumentsCard
          tripId={trip._id}
          documents={trip.documents}
          isArchived={isArchived}
          open={documentsOpen}
          onOpenChange={setDocumentsOpen}
          onAddDocument={() => setShowAddDocumentDialog(true)}
        />

        {isOwner ? (
          <TripDangerZone tripId={trip._id} tripName={trip.name} status={trip.status} />
        ) : null}
      </div>

      {!isArchived ? (
        <ShareCodeDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          title="Share Trip"
          description={`Share this code so others can request to join ${trip.name}.`}
          shareCode={trip.shareCode}
        />
      ) : null}

      <AddTripDocumentDialog
        tripId={trip._id}
        open={showAddDocumentDialog}
        onOpenChange={setShowAddDocumentDialog}
      />

      <AddTransportDialog
        tripId={trip._id}
        apiKey={googleMapsApiKey}
        open={showAddTransportDialog}
        onOpenChange={setShowAddTransportDialog}
      />

      <AddStayDialog
        tripId={trip._id}
        apiKey={googleMapsApiKey}
        open={showAddStayDialog}
        onOpenChange={setShowAddStayDialog}
      />
    </div>
  );
}
