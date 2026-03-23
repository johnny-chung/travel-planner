import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getTripPlannerDataForUser } from "@/features/planner/service";
import {
  buildGoogleMyMapsCsv,
  buildGoogleMyMapsExportRows,
  buildGoogleMyMapsFilename,
} from "@/features/planner/google-my-maps-export";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ lang: string; tripId: string }>;
};

export async function GET(request: Request, context: Context) {
  const session = await auth();
  const { lang, tripId } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL(`/${lang}/login`, request.url));
  }

  const plannerData = await getTripPlannerDataForUser(
    tripId,
    session.user.id,
    "",
    "",
  );

  if (!plannerData) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const rows = buildGoogleMyMapsExportRows(
    plannerData.allStops,
    plannerData.stayItems,
  );
  const csv = buildGoogleMyMapsCsv(rows);
  const filename = buildGoogleMyMapsFilename(plannerData.plan.name);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
