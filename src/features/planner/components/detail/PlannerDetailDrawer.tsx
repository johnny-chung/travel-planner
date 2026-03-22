"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

type Props = {
  children: React.ReactNode;
  title: string;
  description?: string;
  closeHref?: string;
};

export default function PlannerDetailDrawer({
  children,
  title,
  description,
  closeHref,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const isClosingRef = useRef(false);

  function handleClose() {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setOpen(false);

    if (closeHref) {
      router.replace(closeHref);
      return;
    }
    router.back();
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <DrawerContent className="mx-auto flex h-[92vh] max-w-5xl flex-col rounded-t-[28px] sm:h-[88vh]">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <DrawerTitle className="truncate text-base sm:text-lg">
              {title}
            </DrawerTitle>
            {description ? (
              <DrawerDescription className="truncate text-xs sm:text-sm">
                {description}
              </DrawerDescription>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={handleClose}
            aria-label="Close detail drawer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
