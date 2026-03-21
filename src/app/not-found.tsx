import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/12">
        <MapPin className="w-10 h-10 text-primary" />
      </div>

      <p className="mb-2 text-6xl font-bold text-muted-foreground/35">404</p>
      <h1 className="mb-2 text-xl font-bold text-foreground">Page Not Found</h1>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or you may not have access to it.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
