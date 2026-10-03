const BOM = "\uFEFF";
export type CsvValue = string|number|boolean|null|undefined;

export function safeSpreadsheetText(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function cell(value: CsvValue) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? safeSpreadsheetText(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"','""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]) {
  return BOM + [headers, ...rows].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
