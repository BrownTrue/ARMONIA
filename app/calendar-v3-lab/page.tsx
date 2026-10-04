import type { Metadata } from "next";
import { CalendarLab } from "@/components/calendar-v3-lab/calendar-lab";

export const metadata: Metadata = {
  title: "Calendar V3 Lab | Armonia",
  robots: { index: false, follow: false },
};

export default function CalendarV3LabPage() {
  return <CalendarLab />;
}
