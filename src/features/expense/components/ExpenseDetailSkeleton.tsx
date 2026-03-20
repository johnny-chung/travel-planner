import { Skeleton } from "@/components/ui/skeleton";

export default function ExpenseDetailSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background pb-16 md:pb-0 md:pt-16 overflow-hidden">
      <div className="px-4 pb-4 md:pb-6 shrink-0 pt-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
        <Skeleton className="mx-auto h-10 w-[280px] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
