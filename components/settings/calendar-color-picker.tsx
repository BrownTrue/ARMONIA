"use client";

import { CALENDAR_COLOR_PALETTE } from "@/lib/calendar-v2";

export function CalendarColorPicker({ value, onChange, onClear, usedColors = [], description }: {
  value?: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  usedColors?: { color?: string | null }[];
  description: string;
}) {
  return <fieldset>
    <legend className="text-sm font-bold">Colore{onClear ? " (facoltativo)" : " *"}</legend>
    <p className="mt-1 text-xs text-slate-500">{description}</p>
    {onClear && <button type="button" aria-pressed={!value} onClick={onClear} className={`mt-3 min-h-11 rounded-xl border px-4 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-sage-600 ${!value ? "border-sage-500 bg-sage-50 text-sage-800" : "border-slate-200 bg-white text-slate-600"}`}>Usa colore della sede</button>}
    <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">
      {CALENDAR_COLOR_PALETTE.map((color) => {
        const selected = value?.toUpperCase() === color.hex;
        const alreadyUsed = usedColors.some((item) => item.color?.toUpperCase() === color.hex);
        return <button key={color.hex} type="button" aria-label={`${color.name}${selected ? ", selezionato" : ""}${alreadyUsed ? ", già utilizzato" : ""}`} aria-pressed={selected} title={color.name} onClick={() => onChange(color.hex)} className={`grid aspect-square min-h-11 place-items-center rounded-xl border-2 outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 ${selected ? "border-slate-700" : "border-white"}`} style={{ backgroundColor: color.hex }}><span aria-hidden="true" className="text-lg font-black text-white drop-shadow">{selected ? "✓" : ""}</span></button>;
      })}
    </div>
  </fieldset>;
}
