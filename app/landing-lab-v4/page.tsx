import type { Metadata } from "next";
import { LandingLabV4 } from "@/components/landing-v4/landing-lab-v4";

export const metadata: Metadata = {
  title: "Landing Lab V4 | ARMONIA",
  description: "Prototipo commerciale della futura homepage ARMONIA.",
  robots: { index: false, follow: false },
};

export default function LandingLabV4Page() {
  return <LandingLabV4 />;
}
