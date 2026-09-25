import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId } from "@/lib/supabase/server";
import { calendarFeedUrl, isCalendarFeedTitleFormat } from "@/lib/calendar-feed/http";
import {
  activateCalendarFeedSubscription,
  disableCalendarFeedSubscription,
  loadCalendarFeedSubscription,
  rotateCalendarFeedSubscription,
  updateCalendarFeedTitleFormat,
} from "@/lib/calendar-feed/repository";

export const dynamic = "force-dynamic";

const unavailableInLocalMode = () => process.env.NEXT_PUBLIC_DATA_MODE === "local";

const publicValue = (request: NextRequest, subscription: Awaited<ReturnType<typeof loadCalendarFeedSubscription>>) => subscription ? {
  active: subscription.enabled,
  titleFormat: subscription.titleFormat,
  feedUrl: subscription.enabled ? calendarFeedUrl(request.nextUrl.origin, subscription.token) : undefined,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
  rotatedAt: subscription.rotatedAt,
} : { active: false };

const errorResponse = (status = 500) => NextResponse.json({ error: "Calendario ARMONIA non disponibile" }, { status });

export async function GET(request: NextRequest) {
  if (unavailableInLocalMode()) return errorResponse(409);
  try {
    const userId = await authenticatedUserId();
    return NextResponse.json(publicValue(request, await loadCalendarFeedSubscription(userId)));
  } catch { return errorResponse(401); }
}

export async function POST(request: NextRequest) {
  if (unavailableInLocalMode()) return errorResponse(409);
  try {
    const userId = await authenticatedUserId();
    const body = await request.json().catch(() => ({})) as { titleFormat?: unknown };
    const titleFormat = body.titleFormat === undefined ? "abbreviated" : body.titleFormat;
    if (!isCalendarFeedTitleFormat(titleFormat)) return errorResponse(400);
    return NextResponse.json(publicValue(request, await activateCalendarFeedSubscription(userId, titleFormat)), { status: 201 });
  } catch { return errorResponse(); }
}

export async function PATCH(request: NextRequest) {
  if (unavailableInLocalMode()) return errorResponse(409);
  try {
    const userId = await authenticatedUserId();
    const body = await request.json().catch(() => ({})) as { action?: unknown; titleFormat?: unknown };
    if (body.action === "rotate") {
      const subscription = await rotateCalendarFeedSubscription(userId);
      return subscription ? NextResponse.json(publicValue(request, subscription)) : errorResponse(404);
    }
    if (!isCalendarFeedTitleFormat(body.titleFormat)) return errorResponse(400);
    const subscription = await updateCalendarFeedTitleFormat(userId, body.titleFormat);
    return subscription ? NextResponse.json(publicValue(request, subscription)) : errorResponse(404);
  } catch { return errorResponse(); }
}

export async function DELETE() {
  if (unavailableInLocalMode()) return errorResponse(409);
  try {
    const userId = await authenticatedUserId();
    await disableCalendarFeedSubscription(userId);
    return NextResponse.json({ active: false });
  } catch { return errorResponse(); }
}
