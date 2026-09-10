"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { Field, Select, Textarea } from "@/components/form-controls";
import type { Material } from "@/lib/types";
import { fullName, uid } from "@/lib/types";
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
    [filter, setFilter] = useState("tutti");
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
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiali</h1>
          <p className="mt-2 text-slate-500">
            {connection.kind === "cloud" ? "File privati sincronizzati in modo sicuro." : connection.kind === "error" ? "Sincronizzazione non disponibile: controlla lo stato nelle Impostazioni." : "File salvati in locale su questo dispositivo."}
          </p>
        </div>
        <button onClick={() => setEdit("new")} className="btn btn-primary">
          + Carica materiale
        </button>
      </header>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca materiali o tag…"
        className="mb-5 w-full rounded-xl border border-sage-100 bg-white px-4 py-3"
      />
      <div className="mb-6 flex gap-2 overflow-auto">
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
                  className="btn text-sm text-red-600"
                  onClick={() =>
                    confirm("Eliminare questo materiale e il file locale?") &&
                    deleteMaterial(m.id)
                  }
                >
                  Elimina
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
            onDone={() => setEdit(null)}
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
  const visual=material.mimeType.startsWith("image/")||material.mimeType.includes("pdf");
  return <Modal title={material.title} onClose={onDone}><p className="mb-4 text-sm text-slate-500">{material.fileName||material.externalUrl} · {material.mimeType||"link"} · {material.size?formatSize(material.size):"—"}</p>{!url?<div className="rounded-xl bg-sage-50 p-8 text-center">Caricamento anteprima…</div>:visual?<iframe title={`Anteprima ${material.title}`} src={url} className="h-[55vh] w-full rounded-xl border border-sage-100"/>:<div className="rounded-xl bg-sage-50 p-8 text-center"><p className="mb-4">Questo tipo di documento non ha un’anteprima nel browser.</p><a href={url} download={material.fileName} className="btn btn-primary inline-block">Scarica e apri il file</a></div>}</Modal>
}
function formatSize(n: number) {
  return n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1048576).toFixed(1)} MB`;
}
function MaterialForm({
  material,
  onDone,
}: {
  material?: Material;
  onDone: () => void;
}) {
  const { data, saveMaterial } = useData();
  const [file, setFile] = useState<File>();
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
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!material && !file && !v.externalUrl) {
          alert("Seleziona un file oppure inserisci un link.");
          return;
        }
        await saveMaterial(
          {
            ...v,
            fileName: file?.name || v.fileName,
            mimeType: file?.type || v.mimeType || "application/octet-stream",
            size: file?.size || v.size,
          },
          file,
        );
        onDone();
      }}
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
          <Field
            label="Link web (alternativa al file)"
            type="url"
            value={v.externalUrl}
            onChange={set("externalUrl")}
          />
          <label className="block text-sm font-bold">
            File
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="mt-2 block w-full rounded-xl border border-sage-100 p-3 font-normal"
            />
          </label>
          {file && (
            <p className="rounded-xl bg-sage-50 p-3 text-sm">
              {file.name} · {file.type || "tipo sconosciuto"} ·{" "}
              {formatSize(file.size)}
            </p>
          )}
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
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="btn btn-quiet">
          Annulla
        </button>
        <button className="btn btn-primary">Salva materiale</button>
      </div>
    </form>
  );
}
