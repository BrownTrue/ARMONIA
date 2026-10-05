"use client";

import { useEffect, useState } from "react";
import {
  getGoogleCalendarPreferences,
  getGoogleSyncState,
  saveGoogleCalendarPreferences,
  subscribeGoogleSync,
  type GoogleSyncState,
} from "@/lib/google-calendar/client-sync";
import { googleSyncStatusPresentation } from "@/lib/google-calendar/user-facing-status";
import styles from "./calendar-v3-lab.module.css";

type GoogleStatusResponse = {
  configured: boolean;
  connected: boolean;
  syncEnabled?: boolean;
  nameFormat?: "first_initial" | "full" | "initials";
  reminderMinutes?: number;
};

type ConnectionState =
  | { kind: "loading" }
  | { kind: "connected"; syncEnabled: boolean }
  | { kind: "disconnected" }
  | { kind: "unavailable" };

export function GoogleCalendarStatus({ realMode }: { realMode: boolean }) {
  const [connection, setConnection] = useState<ConnectionState>(realMode ? { kind: "loading" } : { kind: "connected", syncEnabled: true });
  const [syncState, setSyncState] = useState<GoogleSyncState>(() => getGoogleSyncState());

  useEffect(() => {
    if (!realMode) return;
    let active = true;
    const unsubscribe = subscribeGoogleSync(() => setSyncState(getGoogleSyncState()));
    setSyncState(getGoogleSyncState());
    void fetch("/api/google-calendar/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("google_status_unavailable");
        return response.json() as Promise<GoogleStatusResponse>;
      })
      .then((status) => {
        if (!active) return;
        if (!status.configured || !status.connected) {
          saveGoogleCalendarPreferences({ ...getGoogleCalendarPreferences(), enabled: false });
          setConnection({ kind: "disconnected" });
          return;
        }
        const current = getGoogleCalendarPreferences();
        const syncEnabled = status.syncEnabled ?? true;
        saveGoogleCalendarPreferences({
          enabled: syncEnabled,
          nameFormat: status.nameFormat ?? current.nameFormat,
          reminderMinutes: status.reminderMinutes ?? current.reminderMinutes,
        });
        setConnection({ kind: "connected", syncEnabled });
      })
      .catch(() => {
        if (active) setConnection({ kind: "unavailable" });
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [realMode]);

  const syncPresentation = googleSyncStatusPresentation(syncState.error, syncState.pending);
  const label = connection.kind === "loading"
    ? "Verifica in corso…"
    : connection.kind === "unavailable"
      ? "Stato non disponibile"
      : connection.kind === "disconnected"
        ? "Non collegato"
        : !connection.syncEnabled
          ? "Sincronizzazione disattivata"
          : syncPresentation.kind === "active"
            ? "Collegato"
            : syncPresentation.kind === "reconnect"
              ? "Ricollegamento richiesto"
              : syncState.pending === 1
                ? "1 modifica in attesa"
                : `${syncState.pending} modifiche in attesa`;
  const warning = connection.kind === "unavailable" || connection.kind === "disconnected" ||
    (connection.kind === "connected" && (!connection.syncEnabled || syncPresentation.kind !== "active"));

  return <div className={styles.googleStatus} role="status" aria-live="polite">
    <div>
      <span className={`${styles.googleDot} ${warning ? styles.googleDotWarning : ""}`} aria-hidden="true" />
      <span>Google Calendar</span>
    </div>
    <span>{label}</span>
  </div>;
}
