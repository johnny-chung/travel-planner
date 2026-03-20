"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  text: string;
  disabled?: boolean;
  iconOnly?: boolean;
  triggerClassName?: string;
};

export default function SharePlanButton({
  title,
  text,
  disabled = false,
  iconOnly = false,
  triggerClassName,
}: Props) {
  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }

      await navigator.clipboard.writeText(text);
      toast.success("Plan copied to clipboard");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      toast.error("Failed to share plan");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? "icon-lg" : "default"}
      className={triggerClassName}
      onClick={handleShare}
      disabled={disabled}
      title="Share plan"
      aria-label="Share plan"
    >
      <Share2 className="w-5 h-5" />
      {iconOnly ? null : <span>Share</span>}
    </Button>
  );
}
