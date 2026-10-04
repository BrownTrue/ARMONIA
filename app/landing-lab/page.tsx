import type { Metadata } from "next";
import { InteractionLab } from "@/components/landing-lab/interaction-lab";

export const metadata: Metadata = {
  title: "Interaction Lab | ARMONIA",
  description: "Laboratorio visuale isolato per il product storytelling di ARMONIA.",
  robots: { index: false, follow: false },
};

export default function LandingLabPage() {
  return <InteractionLab />;
}
