const reconnectError = /(invalid_grant|invalid_client|unauthorized_client|autorizzazione google non riuscit|rinnovo autorizzazione google non riuscit)/i;

export type GoogleSyncErrorPresentation = {
  message: string;
  reconnectRequired: boolean;
};

export type GoogleSyncStatusPresentation = {
  kind: "active" | "pending" | "reconnect";
  title: string;
  message: string;
};

export function googleSyncErrorPresentation(error?: string): GoogleSyncErrorPresentation | null {
  if (!error) return null;
  if (reconnectError.test(error)) {
    return {
      message: "Google Calendar deve essere ricollegato.",
      reconnectRequired: true,
    };
  }
  return {
    message: "Alcuni appuntamenti non sono ancora stati sincronizzati. Riprova tra poco.",
    reconnectRequired: false,
  };
}

export function googleSyncStatusPresentation(error: string | undefined, pending: number): GoogleSyncStatusPresentation {
  const presentedError = googleSyncErrorPresentation(error);
  if (presentedError?.reconnectRequired) {
    return {
      kind: "reconnect",
      title: "Google Calendar deve essere ricollegato",
      message: "Ricollega il tuo account per continuare la sincronizzazione automatica.",
    };
  }
  if (presentedError || pending > 0) {
    return {
      kind: "pending",
      title: "Sincronizzazione in attesa",
      message: pending > 0
        ? `${pending} ${pending === 1 ? "modifica non è ancora stata sincronizzata" : "modifiche non sono ancora state sincronizzate"}.`
        : "Alcuni appuntamenti non sono ancora stati sincronizzati. Riprova tra poco.",
    };
  }
  return {
    kind: "active",
    title: "✓ Sincronizzazione automatica attiva",
    message: "Gli appuntamenti di Armonia vengono sincronizzati automaticamente con Google Calendar.",
  };
}
