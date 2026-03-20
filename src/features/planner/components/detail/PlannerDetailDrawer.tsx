"use client";

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
};

export default function PlannerDetailDrawer({
  children,
  title,
  description,
}: Props) {
  const router = useRouter();

  return (
    <Drawer open onOpenChange={(open) => !open && router.back()}>
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
            onClick={() => router.back()}
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
