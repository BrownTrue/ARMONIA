export function parseMultilineList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatMultilineList(items: string[]): string {
  return items.join("\n");
}
