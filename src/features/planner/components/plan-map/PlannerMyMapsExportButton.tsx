"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, ListChecks } from "lucide-react";

import SignupGateDialog from "@/features/shared/components/SignupGateDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClientDictionary } from "@/features/i18n/client";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  restricted?: boolean;
  iconOnly?: boolean;
  triggerClassName?: string;
};

export default function PlannerMyMapsExportButton({
  href,
  restricted = false,
  iconOnly = false,
  triggerClassName,
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const [open, setOpen] = useState(false);

  const copy = useMemo(
    () => ({
      button:
        dictionary.planner.exportMyMaps ?? "Export for Google My Maps",
      title:
        dictionary.planner.exportMyMapsTitle ?? "Export for Google My Maps",
      description:
        dictionary.planner.exportMyMapsDescription ??
        "Download a CSV file, then import it manually into Google My Maps.",
      guestTitle:
        dictionary.planner.exportMyMapsGuestTitle ??
        "Create an account to export trip locations",
      guestDescription:
        dictionary.planner.exportMyMapsGuestDescription ??
        "Sign up to export your trip locations as a CSV for Google My Maps import.",
      download:
        dictionary.planner.downloadMyMapsCsv ?? "Download CSV",
      step1:
        dictionary.planner.exportMyMapsStep1 ??
        "Download the CSV file.",
      step2:
        dictionary.planner.exportMyMapsStep2 ??
        "Open Google My Maps.",
      step3:
        dictionary.planner.exportMyMapsStep3 ??
        "Create a new map.",
      step4:
        dictionary.planner.exportMyMapsStep4 ??
        "Click Import on a layer and upload the CSV.",
      step5:
        dictionary.planner.exportMyMapsStep5 ??
        "Use the latitude and longitude columns when prompted.",
      step6:
        dictionary.planner.exportMyMapsStep6 ??
        "Save the map, then open it in Google Maps later.",
    }),
    [dictionary.planner],
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={iconOnly ? "icon-lg" : "default"}
        className={triggerClassName}
        title={copy.button}
        onClick={() => setOpen(true)}
      >
        <Download className="h-5 w-5" />
        {iconOnly ? null : <span className="whitespace-nowrap">{copy.button}</span>}
      </Button>

      {restricted ? (
        <SignupGateDialog
          open={open}
          onOpenChange={setOpen}
          title={copy.guestTitle}
          description={copy.guestDescription}
        />
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="mx-4 max-w-md rounded-3xl">
            <DialogHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ListChecks className="h-6 w-6" />
              </div>
              <DialogTitle>{copy.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{copy.description}</p>
            <ol className="space-y-2 pl-5 text-sm text-foreground list-decimal">
              <li>{copy.step1}</li>
              <li>{copy.step2}</li>
              <li>{copy.step3}</li>
              <li>{copy.step4}</li>
              <li>{copy.step5}</li>
              <li>{copy.step6}</li>
            </ol>
            <DialogFooter className="mt-2 gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setOpen(false)}
              >
                {dictionary.planner.cancel}
              </Button>
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "min-w-36 rounded-xl whitespace-nowrap",
                )}
              >
                {copy.download}
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
