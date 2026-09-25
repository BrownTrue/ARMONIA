import { NextRequest } from "next/server";
import { buildCalendarFeed, calendarFeedHttpResponse, calendarFeedWindowStart } from "@/lib/calendar-feed/ics";
import { isCalendarFeedTokenPath } from "@/lib/calendar-feed/http";
import { findEnabledCalendarFeedSubscription, loadCalendarFeedAppointments } from "@/lib/calendar-feed/repository";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not Found", {
  status: 404,
  headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
});

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const value = (await context.params).token;
    if (!isCalendarFeedTokenPath(value)) return notFound();
    const token = value.slice(0, -4);
    const subscription = await findEnabledCalendarFeedSubscription(token);
    if (!subscription) return notFound();
    const appointments = await loadCalendarFeedAppointments(subscription.userId, calendarFeedWindowStart());
    const content = buildCalendarFeed(appointments, subscription.titleFormat);
    return calendarFeedHttpResponse(content, request.headers.get("if-none-match"));
  } catch {
    return new Response("Calendar feed unavailable", {
      status: 500,
      headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
    });
  }
}
