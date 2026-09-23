const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDate = (value: string) => {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error("Inserisci una data valida.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Inserisci una data valida.");
  }
  return date;
};

const formatDate = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

export function generateWeeklyDates(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    throw new Error("Indica la data iniziale e la data di fine ricorrenza.");
  }
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (end < start) {
    throw new Error("La data di fine non può precedere il primo appuntamento.");
  }

  const dates: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    dates.push(formatDate(cursor));
  }
  return dates;
}

export function weekdayName(date: string) {
  return parseDate(date).toLocaleDateString("it-IT", {
    weekday: "long",
    timeZone: "UTC",
  });
}
