"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  shareCode: string;
};

export default function ShareCodeDialog({
  open,
  onOpenChange,
  title,
  description,
  shareCode,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setCopied(false);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{description}</p>
        <div className="flex items-center justify-between bg-muted rounded-2xl px-5 py-4 mt-2">
          <span className="text-3xl font-mono font-bold tracking-widest text-foreground">
            {shareCode}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl hover:bg-muted-foreground/20 transition-colors text-muted-foreground"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        <DialogFooter>
          <Button className="w-full rounded-xl" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
