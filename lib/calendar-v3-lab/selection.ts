import {
  CALENDAR_LAB_CONFIG,
  type CalendarDate,
  clampMinute,
  snapMinute,
} from "./date-time.ts";

export type CalendarSelection = {
  date: CalendarDate;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
};

export function normalizeCalendarSelection(
  date: CalendarDate,
  anchorMinutes: number,
  focusMinutes: number,
  config = CALENDAR_LAB_CONFIG,
): CalendarSelection {
  const first = snapMinute(anchorMinutes, config);
  const second = snapMinute(focusMinutes, config);
  let startMinutes = Math.min(first, second);
  let endMinutes = Math.max(first, second);

  if (endMinutes - startMinutes < config.slotMinutes) {
    if (startMinutes + config.slotMinutes <= config.endHour * 60) {
      endMinutes = startMinutes + config.slotMinutes;
    } else {
      startMinutes = clampMinute(endMinutes - config.slotMinutes, config);
    }
  }

  return {
    date,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
  };
}
