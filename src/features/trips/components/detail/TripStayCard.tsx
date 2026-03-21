import { BedDouble, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { deleteStayAction } from "@/features/trip-logistics/actions";
import { deleteGuestStayAction } from "@/features/guest/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TripStayItem } from "@/types/trip-logistics";

type Props = {
  tripId: string;
  items: TripStayItem[];
  isArchived: boolean;
  canManage?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStay: () => void;
  onEditStay: (item: TripStayItem) => void;
  accessMode?: "user" | "guest";
};

export default function TripStayCard({
  tripId,
  items,
  isArchived,
  canManage = true,
  open,
  onOpenChange,
  onAddStay,
  onEditStay,
  accessMode = "user",
}: Props) {
  const deleteAction = accessMode === "guest" ? deleteGuestStayAction : deleteStayAction;

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BedDouble className="w-4 h-4 text-muted-foreground" /> Stay
          {items.length > 0 ? (
            <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-xs font-medium text-primary">
              {items.length}
            </span>
          ) : null}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0 border-t border-border">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                No stays added yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item._id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 rounded-xl bg-accent/70 p-2 text-accent-foreground">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left rounded-xl transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => onEditStay(item)}
                      disabled={isArchived || !canManage}
                    >
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.checkInDate} → {item.checkOutDate}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {item.address}
                      </p>
                    </button>
                    {!isArchived && canManage ? (
                      <form action={deleteAction}>
                        <input type="hidden" name="tripId" value={tripId} />
                        <input type="hidden" name="stayId" value={item._id} />
                        <SubmitButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {!isArchived ? (
              <div className="px-4 py-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onAddStay}
                  className="flex items-center gap-2 p-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Plus className="w-4 h-4" /> Add stay
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
