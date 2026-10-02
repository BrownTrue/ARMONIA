import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync(new URL("../../../components/clinical-tools/qab-it/qab-runner.tsx", import.meta.url), "utf8");
const stimulus = fs.readFileSync(new URL("../../../components/clinical-tools/qab-it/qab-stimulus-view.tsx", import.meta.url), "utf8");
const editor = fs.readFileSync(new URL("../../../components/clinical-tools/native-tool-editor.tsx", import.meta.url), "utf8");

test("la card QAB distingue avvio ripresa risultati e stop", () => { for (const label of ["Avvia somministrazione", "Riprendi somministrazione", "Vedi risultati", "Somministrazione interrotta"]) assert.match(editor, new RegExp(label)); });
test("il runner rende stop rule confermata, completezza e note facoltative", () => { assert.match(runner, /Conferma interruzione/); assert.match(runner, /Somministrazione incompleta/); assert.match(runner, /Risposta osservata \/ note qualitative/); assert.match(runner, /Cambia modulo \/ ricomincia/); });
test("il timer è esplicitamente non clinico e non persiste nelle risposte", () => { assert.match(runner, /non assegna punteggi e non viene salvato/); assert.doesNotMatch(runner, /timer.*responses/s); });
test("la vista stimolo usa una lightbox contain con fallback ed Escape", () => { assert.match(stimulus, /object-contain/); assert.match(stimulus, /Stimolo digitale non disponibile/); assert.match(stimulus, /event\.key === "Escape"/); assert.match(stimulus, /sm:h-\[85vh\]/); assert.match(stimulus, /bg-slate-950\/55/); });
test("la lightbox offre timer clinicamente neutro e fullscreen solo su richiesta", () => { assert.match(stimulus, /Timer QAB/); assert.match(stimulus, /Risposta senza latenza/); assert.match(stimulus, /Latenza/); assert.match(stimulus, /Finestra conclusa/); assert.match(stimulus, /Schermo intero/); assert.match(stimulus, /openFullscreen/); assert.doesNotMatch(stimulus, /useEffect[\s\S]{0,300}requestFullscreen/); });
test("il fullscreen contiene soltanto la carta, senza controlli clinici", () => { assert.match(stimulus, /ref=\{stimulusRef\}/); assert.match(stimulus, /requestFullscreen/); assert.doesNotMatch(stimulus, /stimulusRef[\s\S]{0,1500}(Target|Punteggio|Note cliniche|Dati paziente)/); });
test("il runner offre onboarding e guida per tutte le sezioni", () => { assert.match(runner, /Prima di iniziare/); assert.match(runner, /Sezione .* di 8/); assert.match(runner, /Guida alla somministrazione/); assert.match(runner, /Inizia la sezione/); });
test("le chiavi React dei prompt ripetuti sono deterministiche e non dipendono dal testo", () => { assert.match(runner, /item\.id}:follow-up:\${index}/); assert.match(runner, /item\.id}:dynamic:\${field\.key}:\${index}/); assert.doesNotMatch(runner, /key=\{prompt\}/); assert.doesNotMatch(runner, /Math\.random|Date\.now\(\).*key/); });
test("il flusso mette consegna, stimolo, timer, note e scoring in ordine", () => { const labels = ["Cosa dire / fare", "Stimolo visivo", "QabTimer", "Risposta osservata / note qualitative", "Assegna il punteggio"]; let cursor = -1; for (const label of labels) { const next = runner.indexOf(label); assert.ok(next > cursor, `${label} deve seguire il blocco precedente`); cursor = next; } });
