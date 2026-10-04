import type { Metadata } from "next";
import { InteractionLabV2 } from "@/components/landing-lab-v2/interaction-lab-v2";

export const metadata: Metadata = {
  title: "Interaction Lab V2 | ARMONIA",
  description: "Laboratorio visuale luminoso per il product storytelling di ARMONIA.",
  robots: { index: false, follow: false },
};

export default function LandingLabV2Page() {
  return <InteractionLabV2 />;
}
