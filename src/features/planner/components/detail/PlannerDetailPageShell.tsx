import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  backHref: string;
  children: React.ReactNode;
};

export default function PlannerDetailPageShell({ backHref, children }: Props) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Link>
        </div>
        <div className="overflow-hidden rounded-[28px] border bg-white shadow-sm">
          <div className="max-h-[calc(100vh-8rem)] overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}
