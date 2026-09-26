import type { SupabaseClient } from "@supabase/supabase-js";
import type { Material } from "@/lib/types";
import { validateMaterialFileDeclaration } from "./files";

const apiError = async (response: Response) => {
  const body = await response.json().catch(() => ({})) as { error?: string };
  const error = new Error(body.error || "material_upload_failed");
  error.name = body.error || "material_upload_failed";
  throw error;
};

export async function uploadTherapeuticMaterial(client: SupabaseClient, material: Material, file: File) {
  validateMaterialFileDeclaration({ fileName: file.name, size: file.size, mimeType: file.type });
  const preparedResponse = await fetch("/api/materials/upload/prepare", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: file.name, size: file.size, mimeType: file.type }),
  });
  if (!preparedResponse.ok) return apiError(preparedResponse);
  const prepared = await preparedResponse.json() as { reservationId: string; materialId: string; path: string; token: string };
  const upload = await client.storage.from("therapy-materials").uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type, upsert: false });
  if (upload.error) {
    // Finalize owns cleanup/release as well: a failed direct upload must not
    // leave its reserved bytes blocked until expiry.
    await fetch("/api/materials/upload/finalize", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId: prepared.reservationId }),
    }).catch(() => undefined);
    const error = new Error("upload_failed");
    error.name = "upload_failed";
    throw error;
  }
  const finalizedResponse = await fetch("/api/materials/upload/finalize", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reservationId: prepared.reservationId, title: material.title, description: material.description,
      category: material.category, tags: material.tags, fileName: file.name,
      patientIds: material.patientIds, favorite: material.favorite,
    }),
  });
  if (!finalizedResponse.ok) return apiError(finalizedResponse);
  return finalizedResponse.json() as Promise<{ materialId: string }>;
}
