import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {completedOnboardingProfile,validateOnboarding} from "./onboarding.ts";

const profile={firstName:"",lastName:"",profession:"",email:"user@example.com",studio:"",calendarColorMode:"location",onboardingCompletedAt:null};

test("onboarding richiede nome cognome e professione ma non studio",()=>{
  assert.deepEqual(validateOnboarding({firstName:"",lastName:"",profession:"",studio:""}),{firstName:"Inserisci il nome.",lastName:"Inserisci il cognome.",profession:"Inserisci la professione."});
  assert.deepEqual(validateOnboarding({firstName:"Mario",lastName:"Rossi",profession:"Logopedista",studio:""}),{});
});

test("completamento preserva il Profile e aggiunge timestamp soltanto al payload valido",()=>{
  const completed=completedOnboardingProfile(profile,{firstName:" Mario ",lastName:" Rossi ",profession:" Logopedista ",studio:""},"2026-10-04T12:00:00.000Z");
  assert.equal(completed.firstName,"Mario");assert.equal(completed.lastName,"Rossi");assert.equal(completed.email,profile.email);assert.equal(completed.onboardingCompletedAt,"2026-10-04T12:00:00.000Z");
});

test("mapper conserva profili legacy completati e nuovi profili null",()=>{const repository=fs.readFileSync(new URL("../supabase/repository.ts",import.meta.url),"utf8");assert.match(repository,/onboardingCompletedAt:profileRow\?\.onboarding_completed_at\?\?null/);assert.match(repository,/onboarding_completed_at:p\.onboardingCompletedAt\?\?null/)});

test("guard blocca route applicative senza mostrare il gestionale",()=>{const gate=fs.readFileSync(new URL("../../components/auth-gate.tsx",import.meta.url),"utf8");assert.match(gate,/onboardingIncomplete/);assert.match(gate,/router\.replace\("\/onboarding"\)/);assert.match(gate,/user && !ready/)});

test("form salva prima del redirect e fallimento non completa lo stato",()=>{const page=fs.readFileSync(new URL("../../app/onboarding/page.tsx",import.meta.url),"utf8");assert.match(page,/await saveProfile\(completedOnboardingProfile/);assert.match(page,/router\.replace\("\/oggi"\)/);assert.match(page,/Non è stato possibile salvare il profilo/);assert.match(page,/noValidate/);assert.match(page,/disabled=\{busy\}/)});

test("save Profile cloud è remote-first",()=>{const provider=fs.readFileSync(new URL("../../components/data-provider.tsx",import.meta.url),"utf8");const save=provider.match(/const saveProfile=.*?;\n/)?.[0]||"";assert.ok(save.indexOf("upsert")<save.indexOf("setData"));});
