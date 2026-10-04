import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { passwordPolicyError,recoveryRedirectUrl,validateNewPassword } from "./password.ts";

test("policy password condivisa richiede 10 caratteri, maiuscola, minuscola e numero",()=>{
  assert.ok(passwordPolicyError("Password1"));
  assert.ok(passwordPolicyError("password10"));
  assert.ok(passwordPolicyError("PASSWORD10"));
  assert.ok(passwordPolicyError("Passwordxx"));
  assert.equal(passwordPolicyError("Password10"),undefined);
  assert.deepEqual(validateNewPassword({password:"Password10",confirmPassword:"Password11"}),{confirmPassword:"Le password non coincidono."});
});

test("recovery usa callback dedicata",()=>assert.equal(recoveryRedirectUrl("https://armonia.example"),"https://armonia.example/auth/recovery"));

test("forgot password è anti-enumeration e usa resetPasswordForEmail",()=>{const source=fs.readFileSync(new URL("../../app/forgot-password/page.tsx",import.meta.url),"utf8");assert.match(source,/resetPasswordForEmail/);assert.match(source,/Se esiste un account associato/);assert.match(source,/redirectTo: recoveryRedirectUrl/);assert.match(source,/disabled=\{busy\}/)});

test("callback recovery scambia il code e crea un marker HttpOnly breve",()=>{const source=fs.readFileSync(new URL("../../app/auth/recovery/route.ts",import.meta.url),"utf8");assert.match(source,/exchangeCodeForSession\(code\)/);assert.match(source,/httpOnly: true/);assert.match(source,/maxAge: 10 \* 60/);assert.match(source,/reason === "cross-device" \? "device"/);assert.match(source,/failure\(request, "incomplete"\)/)});

test("reset richiede sessione, applica updateUser e termina con nuovo login",()=>{const source=fs.readFileSync(new URL("../../app/reset-password/page.tsx",import.meta.url),"utf8");assert.match(source,/auth\.getSession/);assert.match(source,/auth\.updateUser\(\{password:/);assert.match(source,/auth\.signOut\(\{scope:"local"\}\)/);assert.match(source,/Password aggiornata/);assert.match(source,/disabled=\{busy\}/)});

test("impostazioni usano email Auth e non Profile.email",()=>{const source=fs.readFileSync(new URL("../../components/settings/account-security.tsx",import.meta.url),"utf8");assert.match(source,/user\?\.email/);assert.doesNotMatch(source,/profile\.email|data\.profile\.email/);assert.match(source,/auth\.updateUser/)});

test("login espone recupero e signup resta sulla stessa policy",()=>{const login=fs.readFileSync(new URL("../../app/login/page.tsx",import.meta.url),"utf8");const signup=fs.readFileSync(new URL("../../app/signup/page.tsx",import.meta.url),"utf8");assert.match(login,/Password dimenticata/);assert.match(signup,/PASSWORD_POLICY_TEXT/)});

test("weak password è solo un mapping di errore e il login non interpreta warning come credenziali errate",()=>{const provider=fs.readFileSync(new URL("../../components/data-provider.tsx",import.meta.url),"utf8");assert.match(provider,/signInWithPassword/);assert.doesNotMatch(provider,/weakPassword.*EMAIL_NOT_CONFIRMED_MESSAGE/)});
