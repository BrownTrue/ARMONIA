"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useData, isCloudConfigured } from "@/components/data-provider";
import { BRANDING_BUCKET, BRANDING_FALLBACK_LOGO, brandingStoragePath } from "@/lib/branding/config";
import { normalizeBrandingImage } from "@/lib/branding/image";
import { deleteLocalBrandingLogo, readLocalBrandingLogo, writeLocalBrandingLogo } from "@/lib/branding/local-store";
import { createClient } from "@/lib/supabase/client";

type BrandingContextValue = {
  logoSrc: string;
  hasCustomLogo: boolean;
  ready: boolean;
  saveLogo: (file: File) => Promise<void>;
  removeLogo: () => Promise<void>;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useData();
  const client = useMemo(() => isCloudConfigured ? createClient() : null, []);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const currentObjectUrl = useRef<string | null>(null);

  const replaceObjectUrl = (blob?: Blob) => {
    const next = blob ? URL.createObjectURL(blob) : null;
    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    currentObjectUrl.current = next;
    setCustomLogoUrl(next);
  };

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    setReady(false);
    const load = async () => {
      try {
        let blob: Blob | undefined;
        if (client && user) {
          const result = await client.storage.from(BRANDING_BUCKET).download(brandingStoragePath(user.id));
          if (!result.error) blob = result.data;
        } else if (!client) {
          blob = await readLocalBrandingLogo();
        }
        if (active) replaceObjectUrl(blob);
      } catch {
        if (active) replaceObjectUrl();
      } finally {
        if (active) setReady(true);
      }
    };
    void load();
    return () => { active = false; };
  }, [authReady, client, user?.id]);

  useEffect(() => () => { if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current); }, []);

  const saveLogo = async (file: File) => {
    const normalized = await normalizeBrandingImage(file);
    try {
      if (client) {
        if (!user) throw new Error();
        const result = await client.storage.from(BRANDING_BUCKET).upload(brandingStoragePath(user.id), normalized, { upsert: true, contentType: "image/webp", cacheControl: "3600" });
        if (result.error) throw result.error;
      } else {
        await writeLocalBrandingLogo(normalized);
      }
      replaceObjectUrl(normalized);
    } catch {
      throw new Error("Non è stato possibile salvare il logo. Il logo precedente è rimasto invariato.");
    }
  };

  const removeLogo = async () => {
    try {
      if (client) {
        if (!user) throw new Error();
        const result = await client.storage.from(BRANDING_BUCKET).remove([brandingStoragePath(user.id)]);
        if (result.error) throw result.error;
      } else {
        await deleteLocalBrandingLogo();
      }
      replaceObjectUrl();
    } catch {
      throw new Error("Non è stato possibile rimuovere il logo. Il logo attuale è rimasto invariato.");
    }
  };

  return <BrandingContext.Provider value={{ logoSrc: customLogoUrl || BRANDING_FALLBACK_LOGO, hasCustomLogo: Boolean(customLogoUrl), ready, saveLogo, removeLogo }}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw new Error("BrandingProvider missing");
  return context;
}
