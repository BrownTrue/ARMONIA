"use client";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { Field, Select, Textarea } from "@/components/form-controls";
import type { Material } from "@/lib/types";
import { fullName, uid } from "@/lib/types";
import { formatStorageBytes, materialUploadErrorMessage, STORAGE_QUOTA_BYTES, validateMaterialFileDeclaration } from "@/lib/therapeutic-library/files";
import { materialDeleteErrorMessage } from "@/lib/therapeutic-library/material-api";
import { acquireSingleFlight, releaseSingleFlight } from "@/lib/therapeutic-library/single-flight";
const cats = [
  "articolazione",
  "fonologia",
  "linguaggio",
  "lessico",
  "comprensione",
  "fluenza",
  "lettura",
  "scrittura",
  "giochi",
  "valutazione",
  "altro",
];
export default function Materials() {
  const { data, connection, deleteMaterial, saveMaterial } = useData();
  const [edit, setEdit] = useState<Material | null | "new">(null),
    [preview, setPreview] = useState<Material | null>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("tutti"),
    [storage, setStorage] = useState<{quotaBytes:number;usedBytes:number;reservedBytes:number;requiresReconciliation?:boolean}|null>(null),
    [deleteError, setDeleteError] = useState<string>(),
    [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const deletingRef = useRef(new Set<string>());
  const loadStorage=()=>{if(connection.kind!=="cloud")return Promise.resolve();return fetch("/api/materials/storage",{cache:"no-store"}).then(async response=>response.ok?response.json():Promise.reject()).then(setStorage).catch(()=>setStorage(null))};
  useEffect(()=>{void loadStorage()},[connection.kind]);
  const list = data.materials.filter(
    (m) =>
      (m.title + " " + m.tags.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "tutti" ||
        (filter === "preferiti" && m.favorite) ||
        m.category === filter),
  );
  const favorite = async (m: Material) =>
    saveMaterial({ ...m, favorite: !m.favorite });
  return (
    <AppShell>
      <header className="page-header mb-8">
        <div>
          <h1 className="text-3xl font-bold">Materiali</h1>
          <p className="mt-2 text-slate-500">
            {connection.kind === "cloud" ? "File privati sincronizzati in modo sicuro." : connection.kind === "error" ? "Sincronizzazione non disponibile: controlla lo stato nelle Impostazioni." : "File salvati in locale su questo dispositivo."}
          </p>
        </div>
        <button onClick={() => setEdit("new")} className="btn btn-primary w-full sm:w-auto">
          + Carica materiale
        </button>
      </header>
      {connection.kind === "cloud" && storage && <StorageUsage storage={storage}/>}
      {deleteError && <p role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{deleteError}</p>}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca materiali o tag…"
        className="mb-5 w-full rounded-xl border border-sage-100 bg-white px-4 py-3"
      />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {["tutti", "preferiti", ...cats].map((x) => (
          <button
            onClick={() => setFilter(x)}
            className={
              "chip whitespace-nowrap " +
              (filter === x ? "!bg-sage-700 !text-white" : "")
            }
            key={x}
          >
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Nessun materiale. Carica un file o aggiungi un link.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <article className="card p-4" key={m.id}>
              <div className="grid h-24 place-items-center rounded-xl bg-sage-50 text-xl font-bold text-sage-700">
                {m.mimeType.startsWith("image/")
                  ? "IMG"
                  : m.mimeType.startsWith("audio/")
                    ? "AUDIO"
                  : m.externalUrl
                    ? "LINK"
                    : m.mimeType.includes("pdf")
                      ? "PDF"
                      : "FILE"}
              </div>
              <div className="mt-4 flex gap-2">
                <div className="flex-1">
                  <p className="font-bold">{m.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {m.category} · {m.size ? formatSize(m.size) : "link"}
                  </p>
                </div>
                <button
                  aria-label="Preferito"
                  onClick={() => favorite(m)}
                  className="text-xl"
                >
                  {m.favorite ? "★" : "☆"}
                </button>
              </div>
              {m.patientIds.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Collegato a:{" "}
                  {m.patientIds
                    .map((id) => {
                      const p = data.patients.find((x) => x.id === id);
                      return p ? fullName(p) : "";
                    })
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn btn-primary text-sm"
                  onClick={() => setPreview(m)}
                >
                  Apri
                </button>
                <button
                  className="btn btn-quiet text-sm"
                  onClick={() => setEdit(m)}
                >
                  Modifica
                </button>
                <button
                  disabled={deletingIds.has(m.id)}
                  className="btn text-sm text-red-600 disabled:cursor-wait disabled:opacity-50"
                  onClick={async () => {
                    if (deletingRef.current.has(m.id)) return;
                    if (!confirm("Eliminare questo materiale e il relativo file?")) return;
                    if (deletingRef.current.has(m.id)) return;
                    deletingRef.current.add(m.id);
                    setDeletingIds(current => new Set(current).add(m.id));
                    setDeleteError(undefined);
                    try {
                      await deleteMaterial(m.id);
                      await loadStorage();
                    } catch (cause) {
                      setDeleteError(materialDeleteErrorMessage(cause));
                    } finally {
                      deletingRef.current.delete(m.id);
                      setDeletingIds(current => { const next = new Set(current); next.delete(m.id); return next; });
                    }
                  }}
                >
                  {deletingIds.has(m.id) ? "Eliminazione…" : "Elimina"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {edit && (
        <Modal
          title={edit === "new" ? "Aggiungi materiale" : "Modifica materiale"}
          onClose={() => setEdit(null)}
        >
          <MaterialForm
            material={edit === "new" ? undefined : edit}
            quotaFull={Boolean(storage && (storage.requiresReconciliation || storage.usedBytes + storage.reservedBytes >= storage.quotaBytes))}
            onDone={() => { setEdit(null); loadStorage(); }}
          />
        </Modal>
      )}
      {preview && <MaterialPreview material={preview} onDone={() => setPreview(null)}/>} 
    </AppShell>
  );
}

function MaterialPreview({material,onDone}:{material:Material;onDone:()=>void}) {
  const {getMaterialFile}=useData();
  const [url,setUrl]=useState<string>();
  useEffect(()=>{let active=true;let created="";if(material.externalUrl){setUrl(material.externalUrl);return}getMaterialFile(material.id).then(blob=>{if(active&&blob){created=URL.createObjectURL(blob);setUrl(created)}});return()=>{active=false;if(created)URL.revokeObjectURL(created)}},[getMaterialFile,material]);
  const visual=material.mimeType.startsWith("image/")||material.mimeType.includes("pdf"),audio=material.mimeType.startsWith("audio/"),docx=material.fileName.toLowerCase().endsWith(".docx");
  return <Modal title={material.title} onClose={onDone}><p className="mb-4 text-sm text-slate-500">{material.fileName||material.externalUrl} · {material.mimeType||"link"} · {material.size?formatSize(material.size):"—"}</p>{!url?<div className="rounded-xl bg-sage-50 p-8 text-center">Caricamento anteprima…</div>:audio?<audio controls src={url} className="w-full">Il browser non supporta la riproduzione audio.</audio>:visual?<iframe title={`Anteprima ${material.title}`} src={url} className="h-[55vh] w-full rounded-xl border border-sage-100"/>:<div className="rounded-xl bg-sage-50 p-8 text-center"><p className="mb-4">{docx?"Apri il documento con Word, Pages o LibreOffice.":"Questo tipo di documento non ha un’anteprima nel browser."}</p><a href={url} download={material.fileName} className="btn btn-primary inline-block">{docx?"Scarica documento":"Scarica e apri il file"}</a></div>}</Modal>
}
function StorageUsage({storage}:{storage:{quotaBytes:number;usedBytes:number;reservedBytes:number;requiresReconciliation?:boolean}}){const used=storage.usedBytes+storage.reservedBytes,ratio=storage.quotaBytes?used/storage.quotaBytes:0,remaining=Math.max(0,storage.quotaBytes-used),tone=ratio>=1?"bg-red-600":ratio>=.95?"bg-red-500":ratio>=.8?"bg-amber-500":"bg-sage-600";return <div className="card mb-5 p-4"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm font-bold">Spazio utilizzato</p><p className="mt-1 text-sm text-slate-600">{storage.requiresReconciliation?"Utilizzo in verifica":`${formatStorageBytes(used)} di ${formatStorageBytes(storage.quotaBytes||STORAGE_QUOTA_BYTES)}`}</p></div>{!storage.requiresReconciliation&&<p className={`text-sm font-bold ${ratio>=.95?"text-red-700":ratio>=.8?"text-amber-800":"text-slate-500"}`}>{ratio>=1?"Spazio esaurito":`${formatStorageBytes(remaining)} disponibili`}</p>}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Spazio utilizzato ${Math.min(100,Math.round(ratio*100))}%`}><div className={`h-full rounded-full ${tone}`} style={{width:`${Math.min(100,ratio*100)}%`}}/></div></div>}
function formatSize(n: number) {
  return n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1048576).toFixed(1)} MB`;
}
function MaterialForm({
  material,
  quotaFull,
  onDone,
}: {
  material?: Material;
  quotaFull?: boolean;
  onDone: () => void;
}) {
  const { data, saveMaterial } = useData();
  const [file, setFile] = useState<File>(),[mode,setMode]=useState<"file"|"link">(material?.externalUrl?"link":"file"),[fileError,setFileError]=useState<string>(),[uploading,setUploading]=useState(false);
  const uploadGuard = useRef(false);
  const [v, setV] = useState<Material>(
    material || {
      id: uid(),
      title: "",
      description: "",
      category: "altro",
      tags: [],
      fileName: "",
      mimeType: "",
      size: 0,
      favorite: false,
      patientIds: [],
      externalUrl: "",
      createdAt: new Date().toISOString(),
    },
  );
  const set =
    (k: keyof Material) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value = e.target.value;
      setV((old) => ({ ...old, [k]: value }));
    };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acquireSingleFlight(uploadGuard)) return;
    setUploading(true);
    let completed = false;
    try {
      if (!material && mode === "file" && !file) {
        setFileError("Seleziona un file oppure inserisci un link.");
        return;
      }
      if (!material && mode === "link" && !v.externalUrl) {
        setFileError("Inserisci un link.");
        return;
      }
      if (!material && mode === "file" && file) {
        validateMaterialFileDeclaration({ fileName: file.name, size: file.size, mimeType: file.type });
        setFileError(undefined);
      }
      await saveMaterial({
        ...v,
        fileName: mode === "file" ? file?.name || v.fileName : "",
        mimeType: mode === "file" ? file?.type || v.mimeType : "",
        size: mode === "file" ? file?.size || v.size : 0,
        externalUrl: mode === "link" ? v.externalUrl : undefined,
        storagePath: mode === "link" ? undefined : v.storagePath,
      }, mode === "file" ? file : undefined);
      completed = true;
    } catch (cause) {
      const code = cause instanceof Error ? (cause.name || cause.message) : "";
      setFileError(materialUploadErrorMessage(code));
    } finally {
      releaseSingleFlight(uploadGuard);
      setUploading(false);
    }
    if (completed) {
      setFile(undefined);
      setFileError(undefined);
      onDone();
    }
  };
  return (
    <form
      onSubmit={submit}
      className="space-y-4"
    >
      <Field label="Titolo" required value={v.title} onChange={set("title")} />
      <Textarea
        label="Descrizione"
        value={v.description}
        onChange={set("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Categoria" value={v.category} onChange={set("category")}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Field
          label="Tag (separati da virgola)"
          value={v.tags.join(", ")}
          onChange={(e) => { const value=e.target.value; setV((old) => ({
              ...old,
              tags: value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })) }}
        />
      </div>
      {!material && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-sage-50 p-1"><button type="button" disabled={uploading} onClick={()=>{setMode("file");setFileError(undefined)}} className={`rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50 ${mode==="file"?"bg-white text-sage-800 shadow-sm":"text-slate-500"}`}>Carica file</button><button type="button" disabled={uploading} onClick={()=>{setMode("link");setFileError(undefined)}} className={`rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50 ${mode==="link"?"bg-white text-sage-800 shadow-sm":"text-slate-500"}`}>Aggiungi link</button></div>
          {mode==="link"?<><p className="text-sm font-bold text-sage-700">Non utilizza spazio ARMONIA</p><Field
            label="Link web (alternativa al file)"
            type="url"
            value={v.externalUrl}
            onChange={set("externalUrl")}
          /></>:<>
          <label className="block text-sm font-bold">
            File
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.mp3,.m4a,.wav,.docx"
              disabled={quotaFull || uploading}
              onChange={(e) => {const next=e.target.files?.[0];setFile(next);setFileError(undefined);if(next)try{validateMaterialFileDeclaration({fileName:next.name,size:next.size,mimeType:next.type})}catch(cause){setFileError(cause instanceof Error?cause.message:"Questo formato non è supportato.")}}}
              className="mt-2 block w-full rounded-xl border border-sage-100 p-3 font-normal"
            />
          </label>
          {file && (
            <p className="rounded-xl bg-sage-50 p-3 text-sm">
              {file.name} · {file.type || "tipo sconosciuto"} ·{" "}
              {formatSize(file.size)}
            </p>
          )}
          <p className="text-sm text-slate-500">File troppo grande o non compatibile? <button type="button" onClick={()=>{setMode("link");setFileError(undefined)}} className="font-bold text-sage-700 underline">Aggiungi un link</button> invece.</p>
          </>}
          {fileError&&<div role="alert" className="text-sm text-red-700"><p className="font-bold">{fileError}</p><p className="mt-1">Puoi caricare PDF, immagini, audio e documenti DOCX fino a 20 MB.</p><p className="mt-1">Se la risorsa è disponibile online, puoi aggiungere il link senza utilizzare spazio ARMONIA.</p><button type="button" onClick={()=>{setMode("link");setFileError(undefined)}} className="btn btn-quiet mt-2">Aggiungi link</button></div>}
        </>
      )}
      <fieldset>
        <legend className="text-sm font-bold">Collega ai pazienti</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.patients.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.patientIds.includes(p.id)}
                onChange={(e) => { const checked=e.target.checked; setV((old) => ({
                    ...old,
                    patientIds: checked ? [...old.patientIds, p.id] : old.patientIds.filter((x) => x !== p.id),
                  })) }}
              />
              {fullName(p)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={v.favorite}
          onChange={(e) => { const checked=e.target.checked; setV((old) => ({ ...old, favorite: checked })) }}
        />{" "}
        Preferito
      </label>
      <div className="form-actions">
        <button type="button" disabled={uploading} onClick={onDone} className="btn btn-quiet disabled:cursor-wait disabled:opacity-50">
          Annulla
        </button>
        <button disabled={uploading || (!material && mode === "file" && quotaFull)} className="btn btn-primary disabled:cursor-wait disabled:opacity-50">{uploading ? (material ? "Salvataggio…" : "Caricamento…") : "Salva materiale"}</button>
      </div>
    </form>
  );
}
