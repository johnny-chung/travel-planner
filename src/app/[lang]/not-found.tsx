import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";
import { getRequestDictionary } from "@/features/i18n/server";
import { localizeHref } from "@/features/i18n/config";

export default async function NotFound() {
  const { dictionary, locale } = await getRequestDictionary();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/12">
        <MapPin className="h-10 w-10 text-primary" />
      </div>

      <p className="mb-2 text-6xl font-bold text-muted-foreground/35">404</p>
      <h1 className="mb-2 text-xl font-bold text-foreground">
        {dictionary.notFound.title}
      </h1>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {dictionary.notFound.body}
      </p>

      <Link
        href={localizeHref(locale, "/")}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" /> {dictionary.notFound.back}
      </Link>
    </div>
  );
}
