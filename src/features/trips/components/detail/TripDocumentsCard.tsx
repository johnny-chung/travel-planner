import { ChevronDown, ChevronUp, ExternalLink, FileText, Plus, X } from "lucide-react";
import { removeTripDocumentAction } from "@/features/trips/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TripDocument } from "@/types/travel";

type Props = {
  tripId: string;
  documents: TripDocument[];
  isArchived: boolean;
  canManage?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDocument: () => void;
};

export default function TripDocumentsCard({
  tripId,
  documents,
  isArchived,
  canManage = true,
  open,
  onOpenChange,
  onAddDocument,
}: Props) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="w-4 h-4 text-muted-foreground" /> Documents
          {documents.length > 0 ? (
            <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-xs font-medium text-primary">
              {documents.length}
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
            {documents.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                No documents linked yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {documents.map((document) => (
                  <div key={document._id} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 shrink-0 text-primary" />
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 group"
                    >
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {document.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {document.url}
                      </p>
                    </a>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 text-muted-foreground/60 transition-colors hover:text-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {!isArchived && canManage ? (
                      <form action={removeTripDocumentAction}>
                        <input type="hidden" name="tripId" value={tripId} />
                        <input type="hidden" name="documentId" value={document._id} />
                        <SubmitButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
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
                  onClick={onAddDocument}
                  className="flex items-center gap-2 p-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Plus className="w-4 h-4" /> Add document
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
