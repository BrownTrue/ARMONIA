"use client";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { cloudExportSnapshot, localExportSnapshot } from "@/lib/data-export/reader";
import { exportArchiveName, exportFiles, zipExport } from "@/lib/data-export/archive";
import type { DataExportKind } from "@/lib/data-export/types";

const actions:[DataExportKind,string][]=[["patients","Esporta pazienti"],["appointments","Esporta appuntamenti"],["sessions","Esporta sedute"],["economy","Esporta dati economici"],["clinical","Esporta valutazioni cliniche"],["worksheets","Esporta schede e attività"],["materials","Esporta materiali"],["all","Esporta tutto"]];
const singleton = new Set<DataExportKind>(["appointments","sessions","clinical"]);

function download(bytes:BlobPart,name:string,type:string){
  const url=URL.createObjectURL(new Blob([bytes],{type}));
  const anchor=document.createElement("a");anchor.href=url;anchor.download=name;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}

export function DataExportSection({data,user,mode}:{data:AppData;user:User|null;mode:"local"|"cloud"|"error"}){
  const [busy,setBusy]=useState<DataExportKind|null>(null),[message,setMessage]=useState<{kind:"success"|"error";text:string}|null>(null);
  const run=async(kind:DataExportKind)=>{
    if(busy)return;
    if(kind==="all"&&!window.confirm("Esportare tutti i dati?\n\nL’esportazione può contenere dati personali e sanitari. Conserva il file in un luogo sicuro."))return;
    setBusy(kind);setMessage(null);
    try{
      if(mode==="error")throw new Error("Archivio dati non disponibile.");
      if(mode==="cloud"&&!user)throw new Error("Accedi nuovamente per esportare i dati.");
      const snapshot=mode==="cloud"?await cloudExportSnapshot(createClient(),user!):localExportSnapshot(data);
      const files=exportFiles(snapshot,kind);
      if(singleton.has(kind)&&files.length===1){const file=files[0];download(file.content,file.name.split("/").pop()!,file.name.endsWith(".json")?"application/json;charset=utf-8":"text/csv;charset=utf-8");}
      else download(zipExport(snapshot,kind),kind==="all"?exportArchiveName():`armonia-${kind}-${new Date().toISOString().slice(0,10)}.zip`,"application/zip");
      setMessage({kind:"success",text:"Esportazione completata. Il download è stato avviato."});
    }catch(cause){setMessage({kind:"error",text:cause instanceof Error&&cause.message.includes("Accedi")?cause.message:"Non è stato possibile esportare i dati. Riprova."});}
    finally{setBusy(null)}
  };
  return <section className="card mt-5 max-w-2xl p-4 sm:p-6" aria-labelledby="data-export-title">
    <p className="text-xs font-bold uppercase tracking-wide text-sage-700">Dati</p>
    <h2 id="data-export-title" className="mt-1 font-bold">Esporta dati</h2>
    <p className="mt-1 text-sm text-slate-500">Scarica una copia dei dati presenti in ARMONIA.</p>
    <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">I file esportati possono contenere dati personali e sanitari. Conservali in un luogo sicuro.</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-2">{actions.map(([kind,label])=><button key={kind} type="button" disabled={busy!==null} onClick={()=>void run(kind)} className={`btn w-full disabled:cursor-wait disabled:opacity-50 ${kind==="all"?"btn-primary sm:col-span-2":"btn-quiet"}`}>{busy===kind?"Preparazione in corso…":label}</button>)}</div>
    {message&&<p role={message.kind==="error"?"alert":"status"} className={`mt-4 text-sm font-bold ${message.kind==="error"?"text-red-600":"text-sage-700"}`}>{message.text}</p>}
  </section>;
}
