import type { Metadata } from "next";
import { LandingLabV3 } from "@/components/landing-v3/landing-lab-v3";

export const metadata: Metadata = {
  title: "Landing Lab V3 | ARMONIA",
  description: "Prototipo completo della futura homepage ARMONIA.",
  robots: { index: false, follow: false },
};

export default function LandingLabV3Page() {
  return <LandingLabV3 />;
}
