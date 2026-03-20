import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerDetailSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}
