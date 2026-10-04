import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { authEmailRedirectUrl, callbackExchangeFailureReason, callbackFailureReason, callbackSuccessPath, mapAuthError, validateSignup } from "./signup.ts";

test("validazione signup segnala campi richiesti e formato email", () => {
  assert.deepEqual(validateSignup({ email: "", password: "", confirmPassword: "" }), {
    email: "Inserisci l’email.", password: "Inserisci una password.", confirmPassword: "Conferma la password.",
  });
  assert.equal(validateSignup({ email: "non-valida", password: "Password10", confirmPassword: "Password10" }).email, "Inserisci un indirizzo email valido.");
});

test("validazione signup usa la policy condivisa e rifiuta password diverse", () => {
  assert.ok(validateSignup({ email: "utente@example.com", password: "123", confirmPassword: "123" }).password);
  assert.equal(validateSignup({ email: "utente@example.com", password: "Password10", confirmPassword: "Password11" }).confirmPassword, "Le password non coincidono.");
  assert.deepEqual(validateSignup({ email: "utente@example.com", password: "Password10", confirmPassword: "Password10" }), {});
});

test("redirect email conserva solo next interni sicuri", () => {
  assert.equal(new URL(authEmailRedirectUrl("https://armonia.example", "/pazienti/123?tab=resources")).searchParams.get("next"), "/pazienti/123?tab=resources");
  assert.equal(new URL(authEmailRedirectUrl("https://armonia.example", "https://evil.example")).searchParams.get("next"), "/oggi");
});

test("mapping auth è umano e non espone dettagli tecnici", () => {
  assert.match(mapAuthError({ message: "Email not confirmed", code: "email_not_confirmed", status: 400 }), /Conferma/);
  assert.match(mapAuthError({ message: "rate limit exceeded", code: "over_email_send_rate_limit", status: 429 }), /troppi tentativi/);
  assert.doesNotMatch(mapAuthError({ message: "duplicate key value violates constraint users_email_key", code: "unexpected_failure", status: 500 }), /duplicate|constraint|users_email_key/i);
});

test("callback distingue link scaduto, invalido e problemi temporanei", () => {
  assert.equal(callbackFailureReason({ code: "otp_expired" }), "expired");
  assert.equal(callbackFailureReason({ code: "flow_state_not_found" }), "invalid");
  assert.equal(callbackFailureReason({ code: "unexpected_failure" }), "supabase");
});

test("exchange senza verifier PKCE usa la UX cross-device", () => {
  assert.equal(callbackExchangeFailureReason({ code: "validation_failed", description: "PKCE code verifier not found in storage" }), "cross-device");
  assert.equal(callbackExchangeFailureReason({ description: "both auth code and code verifier should be non-empty" }), "cross-device");
  assert.equal(callbackExchangeFailureReason({ code: "otp_expired" }), "expired");
  assert.equal(callbackExchangeFailureReason({ code: "invalid_grant", description: "invalid authorization code" }), "invalid");
});

test("callback riuscita conserva next sicuro e respinge URL esterni", () => {
  assert.equal(callbackSuccessPath(null), "/oggi");
  assert.equal(callbackSuccessPath("/pazienti/123?tab=resources"), "/pazienti/123?tab=resources");
  assert.equal(callbackSuccessPath("https://evil.example"), "/oggi");
});

test("callback usa exchangeCodeForSession e non accetta redirect esterni", () => {
  const source = fs.readFileSync(new URL("../../app/auth/callback/route.ts", import.meta.url), "utf8");
  assert.match(source, /exchangeCodeForSession\(code\)/);
  assert.match(source, /callbackSuccessPath/);
  assert.match(source, /if \(!code\).*incomplete/);
  assert.match(source, /callbackExchangeFailureReason/);
  assert.doesNotMatch(source, /service.role|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/i);
});

test("pagina errore distingue cross-device senza dichiarare certa la conferma", () => {
  const source = fs.readFileSync(new URL("../../app/auth/error/page.tsx", import.meta.url), "utf8");
  assert.match(source, /title: "Email confermata"/);
  assert.match(source, /potrebbe essere già stato verificato/);
  assert.match(source, /Vai al login/);
  assert.match(source, /iniziato la registrazione su un altro dispositivo/);
});

test("signup e resend usano callback dedicata con busy state", () => {
  const signup = fs.readFileSync(new URL("../../app/signup/page.tsx", import.meta.url), "utf8");
  const checkEmail = fs.readFileSync(new URL("../../app/check-email/page.tsx", import.meta.url), "utf8");
  assert.match(signup, /auth\.signUp/);
  assert.match(signup, /emailRedirectTo/);
  assert.match(signup, /disabled=\{busy\}/);
  assert.match(checkEmail, /auth\.resend/);
  assert.match(checkEmail, /type: "signup"/);
  assert.match(checkEmail, /busy \|\| sent/);
  assert.match(mapAuthError({ message: "Email already confirmed", code: "email_confirmed", status: 400 }), /già confermato/);
});

test("il trigger Profile resta la sola fonte di creazione profilo", () => {
  const migration = fs.readFileSync(new URL("../../supabase/migrations/002_profile_fields.sql", import.meta.url), "utf8");
  const signup = fs.readFileSync(new URL("../../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(migration, /create trigger on_auth_user_created/i);
  assert.match(migration, /insert into public\.profiles/i);
  assert.doesNotMatch(signup, /from\(["']profiles["']\)|insert\(/);
});
