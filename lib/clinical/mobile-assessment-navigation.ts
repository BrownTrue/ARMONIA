export type MobileAssessmentSurface =
  | { kind: "overview" }
  | { kind: "section"; step: number }
  | { kind: "modules" }
  | { kind: "module"; moduleKey: string };

export function parseMobileAssessmentSurface(search: string, stepCount: number): MobileAssessmentSurface {
  const params = new URLSearchParams(search);
  const view = params.get("assessmentView");
  if (view === "section") {
    const step = Number(params.get("assessmentStep"));
    if (Number.isInteger(step) && step >= 0 && step < stepCount) return { kind: "section", step };
  }
  if (view === "modules") return { kind: "modules" };
  if (view === "module") {
    const moduleKey = params.get("assessmentModule")?.trim();
    if (moduleKey) return { kind: "module", moduleKey };
  }
  return { kind: "overview" };
}

export function mobileAssessmentSearch(currentSearch: string, surface: MobileAssessmentSurface) {
  const params = new URLSearchParams(currentSearch);
  params.delete("assessmentView");
  params.delete("assessmentStep");
  params.delete("assessmentModule");
  if (surface.kind !== "overview") params.set("assessmentView", surface.kind);
  if (surface.kind === "section") params.set("assessmentStep", String(surface.step));
  if (surface.kind === "module") params.set("assessmentModule", surface.moduleKey);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function previousMobileAssessmentSurface(surface: MobileAssessmentSurface): MobileAssessmentSurface {
  if (surface.kind === "module") return { kind: "modules" };
  return { kind: "overview" };
}

