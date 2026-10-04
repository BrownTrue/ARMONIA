"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/form-controls";
import { useData } from "@/components/data-provider";
import { completedOnboardingProfile,validateOnboarding,type OnboardingFields } from "@/lib/auth/onboarding";

export default function OnboardingPage(){
  const router=useRouter();
  const {data,saveProfile,signOut}=useData();
  const [values,setValues]=useState<OnboardingFields>(()=>({firstName:data.profile.firstName,lastName:data.profile.lastName,profession:data.profile.profession||"Logopedista",studio:data.profile.studio}));
  const [errors,setErrors]=useState<Partial<Record<keyof OnboardingFields,string>>>({}),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const set=(field:keyof OnboardingFields)=>(event:React.ChangeEvent<HTMLInputElement>)=>setValues(current=>({...current,[field]:event.target.value}));
  return <main className="grid min-h-screen place-items-center px-4 py-8"><section className="card w-full max-w-lg p-6 sm:p-9"><p className="text-sm font-bold text-sage-700">Primo accesso</p><h1 className="mt-2 text-3xl font-bold">Benvenuto in ARMONIA</h1><p className="mt-3 text-sm leading-6 text-slate-600">Configuriamo le informazioni essenziali del tuo profilo professionale. Potrai modificare tutto in seguito dalle Impostazioni.</p><form noValidate className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={async event=>{event.preventDefault();if(busy)return;const nextErrors=validateOnboarding(values);setErrors(nextErrors);setError("");if(Object.keys(nextErrors).length){document.getElementById(nextErrors.firstName?"onboarding-first-name":nextErrors.lastName?"onboarding-last-name":"onboarding-profession")?.focus();return}setBusy(true);try{await saveProfile(completedOnboardingProfile(data.profile,values,new Date().toISOString()));router.replace("/oggi")}catch{setError("Non è stato possibile salvare il profilo. Riprova.")}finally{setBusy(false)}}}><Field id="onboarding-first-name" label="Nome *" value={values.firstName} onChange={set("firstName")} error={errors.firstName} /><Field id="onboarding-last-name" label="Cognome *" value={values.lastName} onChange={set("lastName")} error={errors.lastName} /><Field id="onboarding-profession" label="Professione *" value={values.profession} onChange={set("profession")} error={errors.profession} /><Field label="Studio / Centro" value={values.studio} onChange={set("studio")} />{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}<button type="submit" disabled={busy} aria-busy={busy} className="btn btn-primary min-h-11 w-full disabled:cursor-wait disabled:opacity-60 sm:col-span-2">{busy?"Salvataggio…":"Inizia a usare ARMONIA"}</button><button type="button" disabled={busy} onClick={async()=>{await signOut();router.replace("/login")}} className="btn btn-quiet min-h-11 w-full sm:col-span-2">Esci</button></form></section></main>;
}
