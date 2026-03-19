import { BedDouble, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { deleteStayAction } from "@/features/trip-logistics/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TripStayItem } from "@/types/trip-logistics";

type Props = {
  tripId: string;
  items: TripStayItem[];
  isArchived: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStay: () => void;
};

export default function TripStayCard({
  tripId,
  items,
  isArchived,
  open,
  onOpenChange,
  onAddStay,
}: Props) {
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
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
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
                    <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-emerald-600">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.checkInDate} → {item.checkOutDate}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {item.address}
                      </p>
                    </div>
                    {!isArchived ? (
                      <form action={deleteStayAction}>
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
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors p-0"
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
