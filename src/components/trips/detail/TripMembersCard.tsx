import { ChevronDown, ChevronUp, Trash2, Users } from "lucide-react";
import { removeTripMemberAction } from "@/features/trips/actions";
import SubmitButton from "@/components/shared/SubmitButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TripMember } from "@/types/travel";

type Props = {
  tripId: string;
  members: TripMember[];
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function TripMembersCard({
  tripId,
  members,
  isOwner,
  open,
  onOpenChange,
}: Props) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="w-4 h-4 text-muted-foreground" /> Trip Members
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
            {members.length}
          </span>
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0 border-t border-border divide-y divide-border">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={member.image} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {member.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{member.name}</p>
                  <p className="text-muted-foreground text-xs truncate">{member.email}</p>
                </div>
                {member.isOwner ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Owner
                  </Badge>
                ) : null}
                {isOwner && !member.isOwner ? (
                  <form action={removeTripMemberAction}>
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="memberId" value={member.userId} />
                    <SubmitButton
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground/60 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
