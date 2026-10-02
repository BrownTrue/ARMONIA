import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClinicalToolDetail } from "@/components/clinical-tools/tool-detail";
import { getClinicalTool, visibleClinicalTools } from "@/lib/clinical-tools/catalog";

export function generateStaticParams() { return visibleClinicalTools.map((tool) => ({ toolId: tool.id })); }

export default async function ClinicalToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = getClinicalTool(toolId);
  if (!tool) notFound();
  return <AppShell><ClinicalToolDetail tool={tool} /></AppShell>;
}
