import type { Metadata } from "next";
import { CalendarLab } from "@/components/calendar-v3-lab/calendar-lab";

export const metadata: Metadata = {
  title: "Calendario | Armonia",
};

export default function CalendarPage() {
  return <CalendarLab dataMode="real" canonicalHref="/calendario" />;
}
