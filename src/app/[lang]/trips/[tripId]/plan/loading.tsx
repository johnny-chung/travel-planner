export default function TripPlanLoading() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background md:pt-16">
      <div className="border-b border-border px-4 py-3 bg-card">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-40 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="h-full rounded-2xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}
