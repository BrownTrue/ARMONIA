export const STATISTICS_TIME_ZONE = "Europe/Rome";
export type StatisticsPeriodPreset = "current_month" | "previous_month" | "last_3_months" | "last_6_months" | "current_year" | "custom";
export type StatisticsGranularity = "day" | "week" | "month";
export type StatisticsPeriod = { preset: StatisticsPeriodPreset; from: string; to: string; label: string; granularity: StatisticsGranularity };

const iso = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (value: string) => new Date(`${value}T12:00:00Z`);
const startOfMonth = (value: string) => `${value.slice(0, 7)}-01`;
const shiftMonths = (value: string, months: number) => {
  const date = parseDate(startOfMonth(value));
  date.setUTCMonth(date.getUTCMonth() + months);
  return iso(date);
};
const endOfPreviousMonth = (value: string) => {
  const date = parseDate(startOfMonth(value));
  date.setUTCDate(0);
  return iso(date);
};
const daysBetween = (from: string, to: string) => Math.floor((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000) + 1;
const displayDate = (value: string) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseDate(value));

export function romeToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: STATISTICS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function romeClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: STATISTICS_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "00";
  return { date: romeToday(now), minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}

export function statisticsPeriod(preset: StatisticsPeriodPreset, today = romeToday(), custom?: { from: string; to: string }): StatisticsPeriod {
  let from = startOfMonth(today);
  let to = today;
  if (preset === "previous_month") { from = shiftMonths(today, -1); to = endOfPreviousMonth(today); }
  if (preset === "last_3_months") from = shiftMonths(today, -2);
  if (preset === "last_6_months") from = shiftMonths(today, -5);
  if (preset === "current_year") from = `${today.slice(0, 4)}-01-01`;
  if (preset === "custom" && custom?.from && custom?.to) {
    from = custom.from <= custom.to ? custom.from : custom.to;
    to = custom.from <= custom.to ? custom.to : custom.from;
    if (to > today) to = today;
    if (from > to) from = to;
  }
  const duration = daysBetween(from, to);
  const granularity: StatisticsGranularity = preset === "current_year" ? "month" : preset === "last_3_months" || preset === "last_6_months" ? "week" : preset === "custom" ? duration <= 45 ? "day" : duration <= 240 ? "week" : "month" : "day";
  return { preset, from, to, granularity, label: `${displayDate(from)} – ${displayDate(to)}` };
}

export function dateInPeriod(date: string, period: Pick<StatisticsPeriod, "from" | "to">) {
  return date >= period.from && date <= period.to;
}
