import type { AuthError } from "@supabase/supabase-js";
import { safeNextPath } from "./routing.ts";

export const PENDING_SIGNUP_KEY = "armonia-pending-signup-v1";
export const EMAIL_NOT_CONFIRMED_MESSAGE = "Conferma il tuo indirizzo email prima di accedere.";

export type SignupFields = { email: string; password: string; confirmPassword: string };
export type SignupErrors = Partial<Record<keyof SignupFields, string>>;

export function validateSignup(input: SignupFields): SignupErrors {
  const errors: SignupErrors = {};
  const email = input.email.trim();
  if (!email) errors.email = "Inserisci l’email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Inserisci un indirizzo email valido.";
  if (!input.password) errors.password = "Inserisci una password.";
  if (!input.confirmPassword) errors.confirmPassword = "Conferma la password.";
  else if (input.password !== input.confirmPassword) errors.confirmPassword = "Le password non coincidono.";
  return errors;
}

export function authEmailRedirectUrl(origin: string, requestedNext?: string | null) {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeNextPath(requestedNext));
  return callback.toString();
}

export function mapAuthError(error: Pick<AuthError, "message" | "status" | "code"> | Error | null | undefined) {
  if (!error) return "Si è verificato un problema temporaneo. Riprova.";
  const code = "code" in error ? error.code || "" : "";
  const status = "status" in error ? error.status : undefined;
  const message = error.message.toLowerCase();
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return EMAIL_NOT_CONFIRMED_MESSAGE;
  if (code === "email_address_invalid" || message.includes("invalid email")) return "Inserisci un indirizzo email valido.";
  if (code === "weak_password" || message.includes("password should be") || message.includes("weak password")) return "La password non rispetta i requisiti di sicurezza. Scegline una più lunga.";
  if (status === 429 || code.includes("rate_limit") || message.includes("rate limit")) return "Hai effettuato troppi tentativi. Attendi qualche minuto e riprova.";
  if (message.includes("fetch") || message.includes("network")) return "Non è stato possibile contattare il servizio. Controlla la connessione e riprova.";
  if (code.includes("email_confirmed") || message.includes("already confirmed")) return "L’indirizzo potrebbe essere già confermato. Prova ad accedere normalmente.";
  if (code === "user_already_exists" || message.includes("already registered") || message.includes("already exists")) {
    return "Se l’indirizzo può essere registrato, riceverai un’email con le istruzioni.";
  }
  return "Non è stato possibile completare l’operazione. Riprova tra poco.";
}

export function callbackFailureReason(input: { code?: string | null; description?: string | null }) {
  const value = `${input.code || ""} ${input.description || ""}`.toLowerCase();
  if (value.includes("expired") || value.includes("otp_expired")) return "expired";
  if (value.includes("invalid") || value.includes("flow_state")) return "invalid";
  return "supabase";
}

export function callbackExchangeFailureReason(input: { code?: string | null; description?: string | null }) {
  const value = `${input.code || ""} ${input.description || ""}`.toLowerCase();
  if (value.includes("expired") || value.includes("otp_expired")) return "expired";
  if (value.includes("code verifier") || value.includes("code_verifier") || value.includes("pkce")) return "cross-device";
  if (value.includes("invalid") || value.includes("flow_state")) return "invalid";
  return "supabase";
}

export const callbackSuccessPath = (requestedNext?: string | null) => safeNextPath(requestedNext);
