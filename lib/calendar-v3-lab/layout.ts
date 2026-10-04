import type { CalendarLabEvent } from "./fixtures.ts";

export const CALENDAR_LAB_PIXELS_PER_HOUR = 56;
export const CALENDAR_LAB_EVENT_GAP = 2;

export type CalendarLabEventLayout = CalendarLabEvent & {
  column: number;
  columnCount: number;
};

function overlaps(left: CalendarLabEvent, right: CalendarLabEvent): boolean {
  return left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes;
}

export function layoutCalendarLabEvents(
  events: readonly CalendarLabEvent[],
): CalendarLabEventLayout[] {
  const byDate = new Map<string, CalendarLabEvent[]>();
  for (const event of events) {
    const current = byDate.get(event.date) ?? [];
    current.push(event);
    byDate.set(event.date, current);
  }

  const result: CalendarLabEventLayout[] = [];
  for (const dateEvents of byDate.values()) {
    const sorted = [...dateEvents].sort(
      (left, right) =>
        left.startMinutes - right.startMinutes ||
        left.endMinutes - right.endMinutes ||
        left.id.localeCompare(right.id),
    );
    let group: Array<CalendarLabEvent & { column: number }> = [];
    let groupEnd = -1;

    const flush = () => {
      if (!group.length) return;
      const columnCount = Math.max(...group.map((event) => event.column)) + 1;
      result.push(...group.map((event) => ({ ...event, columnCount })));
      group = [];
      groupEnd = -1;
    };

    for (const event of sorted) {
      if (group.length && event.startMinutes >= groupEnd) flush();
      const usedColumns = new Set(
        group.filter((placed) => overlaps(placed, event)).map((placed) => placed.column),
      );
      let column = 0;
      while (usedColumns.has(column)) column += 1;
      group.push({ ...event, column });
      groupEnd = Math.max(groupEnd, event.endMinutes);
    }
    flush();
  }
  return result;
}

export function eventHorizontalStyle(layout: CalendarLabEventLayout) {
  const width = 100 / layout.columnCount;
  return {
    left: `calc(${layout.column * width}% + ${CALENDAR_LAB_EVENT_GAP}px)`,
    width: `calc(${width}% - ${CALENDAR_LAB_EVENT_GAP * 2}px)`,
  };
}
