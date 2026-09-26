export class MaterialRequestError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "MaterialRequestError";
    this.code = code;
    this.status = status;
  }
}

export async function deleteTherapeuticMaterial(materialId: string, request: typeof fetch = fetch) {
  let response: Response;
  try {
    response = await request(`/api/materials/${encodeURIComponent(materialId)}`, { method: "DELETE" });
  } catch {
    throw new MaterialRequestError("material_network_error", 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new MaterialRequestError(
      response.status === 401 ? "material_auth_required" : body.error || "material_delete_failed",
      response.status,
    );
  }
  return response.json() as Promise<{ deleted: true; alreadyDeleted?: boolean }>;
}

export async function saveTherapeuticMaterialMetadata(body: unknown, request: typeof fetch = fetch) {
  let response: Response;
  try {
    response = await request("/api/materials", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new MaterialRequestError("material_network_error", 0);
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new MaterialRequestError(response.status === 401 ? "material_auth_required" : result.error || "material_save_failed", response.status);
  }
  return response.json() as Promise<{ materialId: string }>;
}

export function materialSaveErrorMessage(cause: unknown, kind: "link" | "material") {
  const code = cause instanceof MaterialRequestError ? cause.code : "material_save_failed";
  if (code === "material_auth_required") return "La sessione è scaduta. Accedi di nuovo per salvare il materiale.";
  if (code === "material_network_error") return "Non è stato possibile raggiungere il server. Controlla la connessione e riprova.";
  if (code === "invalid_external_url") return "Inserisci un link HTTP o HTTPS valido.";
  if (code === "invalid_patient_association") return "Una delle associazioni paziente non è valida. Ricarica la pagina e riprova.";
  return kind === "link" ? "Non è stato possibile salvare il link. Riprova." : "Non è stato possibile salvare il materiale. Riprova.";
}

export function materialDeleteErrorMessage(cause: unknown) {
  if (cause instanceof MaterialRequestError && cause.code === "material_auth_required") {
    return "La sessione è scaduta. Accedi di nuovo per eliminare il materiale.";
  }
  if (cause instanceof MaterialRequestError && cause.code === "material_network_error") {
    return "Non è stato possibile raggiungere il server. Controlla la connessione e riprova.";
  }
  return "Non è stato possibile eliminare il materiale. Riprova.";
}
