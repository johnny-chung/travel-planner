import { ChevronDown, ChevronUp, Plane, Plus, Route, Trash2 } from "lucide-react";
import { deleteTransportAction } from "@/features/trip-logistics/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TripTransportItem } from "@/types/trip-logistics";

type Props = {
  tripId: string;
  items: TripTransportItem[];
  isArchived: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransport: () => void;
};

export default function TripTransportCard({
  tripId,
  items,
  isArchived,
  open,
  onOpenChange,
  onAddTransport,
}: Props) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Plane className="w-4 h-4 text-muted-foreground" /> Transport
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
                No transport added yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item._id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 rounded-xl bg-blue-50 p-2 text-blue-600">
                      {item.type === "flight" ? (
                        <Plane className="w-4 h-4" />
                      ) : (
                        <Route className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.departureDate} {item.departureTime} → {item.arrivalDate} {item.arrivalTime}
                      </p>
                      {item.departure.name || item.arrival.name ? (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.departure.name || item.departure.address.split(",")[0]} →{" "}
                          {item.arrival.name || item.arrival.address.split(",")[0]}
                        </p>
                      ) : null}
                    </div>
                    {!isArchived ? (
                      <form action={deleteTransportAction}>
                        <input type="hidden" name="tripId" value={tripId} />
                        <input type="hidden" name="transportId" value={item._id} />
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
                  onClick={onAddTransport}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors p-0"
                >
                  <Plus className="w-4 h-4" /> Add transport
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
