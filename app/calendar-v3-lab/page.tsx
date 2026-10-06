import type { Metadata } from "next";
import { CalendarLab } from "@/components/calendar-v3-lab/calendar-lab";

export const metadata: Metadata = {
  title: "Calendar V3 Lab | Armonia",
  robots: { index: false, follow: false },
};

export default async function CalendarV3LabPage({ searchParams }: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return <CalendarLab
    dataMode={mode === "real" ? "real" : "fixture"}
    canonicalHref="/calendar-v3-lab"
    showModeNotice
  />;
}
