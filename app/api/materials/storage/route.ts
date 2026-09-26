import { NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_QUOTA_BYTES } from "@/lib/therapeutic-library/files";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ cloud: false });
  try {
    const userId = await authenticatedUserId();
    const service = supabaseServiceClient();
    const { data, error } = await service.from("user_storage_accounts")
      .select("quota_bytes,used_bytes,reserved_bytes,updated_at").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) {
      const { count, error: countError } = await service.from("materials")
        .select("id", { count: "exact", head: true }).eq("user_id", userId).not("storage_path", "is", null);
      if (countError) throw countError;
      return NextResponse.json({ cloud: true, initialized: false, requiresReconciliation: Boolean(count), quotaBytes: STORAGE_QUOTA_BYTES, usedBytes: 0, reservedBytes: 0 });
    }
    return NextResponse.json({ cloud: true, initialized: true, requiresReconciliation: false, quotaBytes: Number(data.quota_bytes), usedBytes: Number(data.used_bytes), reservedBytes: Number(data.reserved_bytes), updatedAt: data.updated_at });
  } catch {
    return NextResponse.json({ error: "Archivio temporaneamente non disponibile." }, { status: 500 });
  }
}
