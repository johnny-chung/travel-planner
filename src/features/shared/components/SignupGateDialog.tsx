"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { signInWithAuth0Action } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { localizeHref } from "@/features/i18n/config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export default function SignupGateDialog({
  open,
  onOpenChange,
  title,
  description,
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const locale = getClientLocale(pathname);
  const resolvedTitle = title ?? dictionary.signupGate.title;
  const resolvedDescription =
    description ?? dictionary.signupGate.description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle>{resolvedTitle}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{resolvedDescription}</p>
        <DialogFooter className="gap-2 flex-col sm:flex-col">
          <form action={signInWithAuth0Action} className="w-full">
            <input
              type="hidden"
              name="redirectTo"
              value={localizeHref(locale, "/auth/post-login")}
            />
            <Button type="submit" className="w-full rounded-xl">
              {dictionary.signupGate.signUp}
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {dictionary.signupGate.maybeLater}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
