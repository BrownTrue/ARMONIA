import { notFound } from "next/navigation";
import DesignLab from "./design-lab";

export const dynamic = "force-dynamic";

export default function DesignLabPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignLab />;
}
