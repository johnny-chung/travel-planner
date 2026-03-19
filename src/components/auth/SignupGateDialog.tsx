"use client";

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export default function SignupGateDialog({
  open,
  onOpenChange,
  title = "Create an account to unlock this",
  description = "Sign up to keep your draft, unlock route planning, stays, transport, documents, expenses, and collaboration.",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter className="gap-2 flex-col sm:flex-col">
          <form action={signInWithAuth0Action} className="w-full">
            <input type="hidden" name="redirectTo" value="/auth/post-login" />
            <Button type="submit" className="w-full rounded-xl">
              Sign Up
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
