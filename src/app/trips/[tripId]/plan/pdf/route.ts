import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { getTripPlannerDataForUser } from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { renderPlannerPdf } from "@/features/planner/pdf";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ tripId: string }>;
};

function buildFilename(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "trip"}-itinerary.pdf`;
}

export async function GET(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { tripId } = await context.params;
  const searchState = parsePlannerSearchParams(new URL(request.url).searchParams);
  const plannerData = await getTripPlannerDataForUser(
    tripId,
    session.user.id,
    searchState.from,
    searchState.to,
  );

  if (!plannerData) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const printUrl = new URL(`/trips/${tripId}/plan/print`, requestUrl.origin);
  requestUrl.searchParams.forEach((value, key) => {
    printUrl.searchParams.set(key, value);
  });
  printUrl.searchParams.set("pdf", "1");

  const pdf = await renderPlannerPdf({
    origin: requestUrl.origin,
    printPath: `${printUrl.pathname}${printUrl.search}`,
    cookieHeader: request.headers.get("cookie") ?? "",
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildFilename(plannerData.plan.name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
