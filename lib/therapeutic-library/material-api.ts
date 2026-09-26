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

export function materialDeleteErrorMessage(cause: unknown) {
  if (cause instanceof MaterialRequestError && cause.code === "material_auth_required") {
    return "La sessione è scaduta. Accedi di nuovo per eliminare il materiale.";
  }
  if (cause instanceof MaterialRequestError && cause.code === "material_network_error") {
    return "Non è stato possibile raggiungere il server. Controlla la connessione e riprova.";
  }
  return "Non è stato possibile eliminare il materiale. Riprova.";
}
