import type { QabAttribution, QabDynamicField, QabForm, QabFormDefinition, QabScore, QabScoredItem, QabSection, QabSectionCode, QabStimulusCard } from "./types.ts";

const ALL: readonly QabScore[] = [0, 1, 2, 3, 4];
const NO_TWO: readonly QabScore[] = [0, 1, 3, 4];
const ONLY_ZERO_FOUR: readonly QabScore[] = [0, 4];
const letters = "abcdefghijkl";
const itemId = (form: QabForm, section: string, index: number) => `qab${form}-${section}-${letters[index]}`;
const scoredItems = (form: QabForm, section: string, labels: readonly string[], allowedScores = ALL): QabScoredItem[] =>
  labels.map((label, index) => ({ id: itemId(form, section, index), label, target: label, allowedScores }));

const exactPlace: QabDynamicField = { key: "exactPlace", label: "Posto esatto", kind: "text" };
const exactMonth: QabDynamicField = { key: "exactMonth", label: "Mese esatto", kind: "month" };
const wrongMonths: QabDynamicField = { key: "wrongMonths", label: "Mesi inesatti", kind: "month", repeatable: true };
const exactAge: QabDynamicField = { key: "exactAge", label: "Età esatta", kind: "number" };
const wrongAges: QabDynamicField = { key: "wrongAges", label: "Età inesatte", kind: "number", repeatable: true };

export const QAB_ITALIAN_ADMINISTRATION_RULES = [
  "Fornire 6 secondi per la risposta in ogni sezione; una risposta corretta dopo 3 secondi è una latenza e riceve 3 punti.",
  "Valutare il materiale prodotto nei primi 6 secondi, salvo una risposta iniziata prima dei 6 secondi e poi continuata.",
  "Valutare la prima risposta completa, non una falsa partenza o un frammento.",
  "Gli item verbali possono essere ripetuti una volta su richiesta o per sospetta mancata comprensione/concentrazione; dopo la ripetizione il conteggio riparte da zero.",
  "Gli errori da disartria o aprassia articolatoria che non alterano l’identificazione dei fonemi possono essere ignorati, eccetto nella valutazione del linguaggio motorio.",
] as const;

function awareness(form: QabForm): QabSection {
  return {
    code: "awareness",
    title: "Livello di consapevolezza",
    instructions: "Valutare stabilità, veglia, orientamento, comprensione delle istruzioni e impressione complessiva secondo lo scoresheet ufficiale.",
    items: [
      { id: itemId(form, "awareness", 0), label: "Stabilità clinica", prompt: "Il/la paziente è sufficientemente e clinicamente stabile per essere avvicinato/a?", allowedScores: ONLY_ZERO_FOUR, stopRule: { scores: [0], reason: "Paziente non sufficientemente stabile: non continuare." } },
      { id: itemId(form, "awareness", 1), label: "Stato di veglia", prompt: "Il/la paziente può rimanere sveglio/a?", allowedScores: ALL, stopRule: { scores: [0, 1], reason: "Stato di veglia insufficiente: non continuare." } },
      { id: itemId(form, "awareness", 2), label: "Orientamento al luogo", prompt: "Puoi dirmi dove siamo adesso?", followUpPrompts: ["Siamo in una biblioteca?", "Siamo in un cortile per la ricreazione?", "Siamo in [inserire posto esatto]?"], allowedScores: ALL, dynamicFields: [exactPlace] },
      { id: itemId(form, "awareness", 3), label: "Orientamento al mese", prompt: "Puoi dirmi che mese è?", followUpPrompts: ["È [mese inesatto]?", "È [mese inesatto]?", "È [mese esatto]?"], allowedScores: ALL, dynamicFields: [exactMonth, wrongMonths] },
      { id: itemId(form, "awareness", 4), label: "Orientamento all’età", prompt: "Quanti anni hai?", followUpPrompts: ["Hai [età inesatta]?", "Hai [età esatta]?", "Hai [età inesatta]?"], allowedScores: ALL, dynamicFields: [exactAge, wrongAges] },
      { id: itemId(form, "awareness", 5), label: "Chiusura degli occhi", prompt: "Chiudi gli occhi.", followUpPrompts: ["Fungere da modello chiudendo gli occhi e invitare il/la paziente: «Adesso tocca a te»."], allowedScores: NO_TWO },
      { id: itemId(form, "awareness", 6), label: "Stretta di mano", prompt: "Stringimi la mano.", followUpPrompts: ["Fungere da modello stringendo la mano del paziente e invitare il/la paziente: «Adesso tocca a te»."], allowedScores: NO_TWO },
      { id: itemId(form, "awareness", 7), label: "Impressione complessiva", prompt: "Il/la paziente è in grado di rimanere sveglio, mantenere l’attenzione e seguire le istruzioni?", allowedScores: ALL, stopRule: { scores: [0, 1, 2], reason: "Consapevolezza complessiva insufficiente: non continuare." } },
    ],
  };
}

const spontaneousDimensions = [
  "Enunciati di lunghezza e complessità ridotta",
  "Ridotta velocità di produzione (WPM)",
  "Discorso telegrafico / agrammatismo",
  "Paragrammatismo",
  "Anomia",
  "Discorso privo di significato",
  "Parafasie semantiche",
  "Parafasie fonemiche e neologismi",
  "Correzioni spontanee",
  "Compromissione globale della comunicazione",
] as const;
const conversationPrompts = [
  "il viaggio preferito che hai fatto", "il viaggio peggiore che hai fatto", "quando ti sei sposato/a", "la tua festa preferita da bambino",
  "un ricordo felice dell’infanzia", "il tuo primo lavoro", "il ricordo peggiore dell’infanzia", "quando hai avuto il primo figlio",
  "come hai incontrato tuo marito, o tua moglie, o il tuo compagno/a", "quando sei andato/a in pensione", "cosa ti piace del posto in cui vivi",
  "un episodio in cui hai avuto paura, sei stato/a in imbarazzo o ti sei arrabbiato/a",
] as const;
const spontaneousScenes: Record<QabForm, readonly string[]> = {
  1: ["L’uomo spinge la donna.", "La donna insegue l’uomo."],
  2: ["L’uomo lava la donna.", "La donna prende a calci l’uomo."],
  3: ["La donna tira l’uomo.", "L’uomo bacia la donna."],
};
function spontaneousSpeech(form: QabForm): QabSection {
  return {
    code: "spontaneousSpeech", title: "Eloquio spontaneo",
    instructions: "Conversare per almeno tre minuti; mostrare la scheda 1 e chiedere «Che cosa succede qui?». Valutare anche altro eloquio spontaneo prodotto durante la valutazione.",
    prompts: [...conversationPrompts, ...spontaneousScenes[form]],
    items: scoredItems(form, "spontaneous-speech", spontaneousDimensions),
    nonScorableOptions: ["Assenza di linguaggio spontaneo", "Solo stereotipie", "Solo un incomprensibile borbottio", "Meno di 10 parole al minuto, per lo più sì/no, singole parole o tentativi"],
  };
}

const wordTargets: Record<QabForm, readonly [string, readonly string[]][]> = {
  1: [["leone", ["giraffa", "cavallo"]], ["tamburo", ["violino", "trombone"]], ["violino", ["tamburo", "trombone"]], ["giraffa", ["leone", "cavallo"]], ["spalla", ["palla"]], ["naso", ["vaso", "raso"]], ["pala", ["palla"]], ["raso", ["vaso", "naso"]]],
  2: [["chitarra", ["sassofono", "arpa"]], ["tigre", ["zebra", "asino"]], ["zebra", ["tigre", "asino"]], ["sassofono", ["chitarra", "arpa"]], ["duna", ["luna"]], ["petto", ["tetto", "letto"]], ["letto", ["tetto", "petto"]], ["lana", ["luna"]]],
  3: [["elefante", ["cammello", "orso"]], ["piano", ["tromba", "violoncello"]], ["cammello", ["elefante", "orso"]], ["tromba", ["piano", "violoncello"]], ["zappa", ["kappa", "mappa"]], ["fango", ["mango", "fungo"]], ["fungo", ["fango"]], ["mappa", ["zappa", "kappa"]]],
};
function wordComprehension(form: QabForm): QabSection {
  return { code: "wordComprehension", title: "Comprensione di parole singole", instructions: "Mostrare la scheda 2 per gli item semantici e la scheda 3 per gli item fonologici. Dire «Mostrami il/la…».", items: wordTargets[form].map(([target, distractors], index) => ({ id: itemId(form, "word-comprehension", index), label: target, target, relatedDistractors: distractors, allowedScores: NO_TWO })) };
}

const sentenceTargets: Record<QabForm, readonly [string, QabDynamicField[] | undefined, "yes" | "no"][]> = {
  1: [
    ["Sei [uomo/donna]?", [{ key: "patientGender", label: "Uomo/donna del paziente", kind: "choice", options: ["uomo", "donna"] }], "yes"],
    ["Sono [uomo/donna]?", [{ key: "examinerGender", label: "Uomo/donna dell’esaminatore", kind: "choice", options: ["uomo", "donna"] }], "no"],
    ["Si taglia l’erba con l’ascia?", undefined, "no"], ["I bambini sono sorvegliati dalla babysitter?", undefined, "yes"],
    ["Apri la porta di casa con una chiave?", undefined, "yes"], ["Se stai per uscire, sei già uscito?", undefined, "no"],
    ["I testimoni vengono interrogati dalla polizia?", undefined, "yes"], ["Se dico che fumavo, pensi che io fumi adesso?", undefined, "no"],
    ["I medici vengono curati dai pazienti?", undefined, "no"], ["Se ero al parco quando siete arrivati, sono arrivato prima?", undefined, "yes"],
    ["Se stai per salire al piano di sopra, sei ancora al piano di sotto?", undefined, "yes"], ["I gatti sono inseguiti dai topi?", undefined, "no"],
  ],
  2: [
    ["Sei [seduto/sdraiato/etc.]?", [{ key: "patientPosition", label: "Posizione del paziente", kind: "text" }], "yes"],
    ["Sono [seduto/sdraiato/etc.]?", [{ key: "examinerPosition", label: "Posizione dell’esaminatore", kind: "text" }], "no"],
    ["Mangi il gelato con un cucchiaio?", undefined, "yes"], ["I ragni sono morsi dalle persone?", undefined, "no"],
    ["Indossi i guanti ai piedi?", undefined, "no"], ["Se stai per uscire, sei ancora dentro?", undefined, "yes"],
    ["I vermi vengono mangiati dagli uccelli?", undefined, "yes"], ["Se ti dico che facevo esercizio fisico, pensi che lo faccia adesso?", undefined, "no"],
    ["I bambini vengono fatti nascere da medici?", undefined, "yes"], ["Se stai per iniziare, hai già iniziato?", undefined, "no"],
    ["I genitori sono cresciuti dai figli?", undefined, "no"], ["Se eri alla festa quando sono arrivato, sei arrivato prima?", undefined, "yes"],
  ],
  3: [
    ["Indosso un/a [camicia/abito] [colore]?", [{ key: "examinerGarment", label: "Capo dell’esaminatore", kind: "text" }, { key: "examinerGarmentColor", label: "Colore del capo", kind: "text" }], "yes"],
    ["Indossa un/a [camicia/abito] [colore]?", [{ key: "examinerGarment", label: "Capo dell’esaminatore", kind: "text" }, { key: "examinerGarmentColor", label: "Colore del capo", kind: "text" }], "no"],
    ["Ti lavi i denti con il pettine?", undefined, "no"], ["I bambini vengono sgridati dai genitori?", undefined, "yes"],
    ["Scatti le foto con una macchina fotografica?", undefined, "yes"], ["Se stai per finire, hai già finito?", undefined, "no"],
    ["Le persone sono tassate dai governi?", undefined, "yes"], ["Se stai per entrare, sei ancora fuori?", undefined, "yes"],
    ["I lupi vengono aggrediti dai cervi?", undefined, "no"], ["Se era presente alla mostra quando siete arrivati, è arrivato per primo?", undefined, "yes"],
    ["I ladri sono derubati dalle vittime?", undefined, "no"], ["Se ti dico che bevevo caffè, pensi che lo beva adesso?", undefined, "no"],
  ],
};
function sentenceComprehension(form: QabForm): QabSection {
  return { code: "sentenceComprehension", title: "Comprensione di frasi su stimolo verbale", instructions: "Iniziare ogni frase con «Rispondi sì o no». Sono accettabili gesti e risposte idiosincratiche che indichino comprensione.", items: sentenceTargets[form].map(([prompt, dynamicFields, expectedAnswer], index) => ({ id: itemId(form, "sentence-comprehension", index), label: prompt, prompt, expectedAnswer, dynamicFields, allowedScores: ALL })) };
}

const namingTargets: Record<QabForm, readonly string[]> = { 1: ["cane", "matita", "carrozzina", "polpo", "amaca", "ascensore"], 2: ["libro", "pettine", "maschera", "vulcano", "cuore", "piramide"], 3: ["letto", "fiore", "zucca", "armonica", "pellicano", "stetoscopio"] };
const repetitionTargets: Record<QabForm, readonly string[]> = { 1: ["se", "treno", "monociclo", "rilevabile", "Il sole sorge ad oriente.", "Il bravo giornalista scoprì dov’erano andati."], 2: ["re", "scopa", "staccionata", "mozzafiato", "Il cane abbaia alla porta.", "L’architetto sa chi vedremo domani a pranzo."], 3: ["ma", "spada", "prossimità", "socievole", "Il bambino beve dal biberon.", "Il cantante ha capito dove avremmo alloggiato."] };
const readingTargets: Record<QabForm, readonly string[]> = { 1: ["la", "quota", "lavatrice", "disordinato", "Il bambino piange di notte.", "Il romanziere capì perché avevo chiamato."], 2: ["per", "igiene", "bilancia", "affettuoso", "Il sole tramonta a ovest.", "L’investigatore scoprì perché stavo aspettando."], 3: ["su", "balia", "strofinaccio", "orgoglioso", "Il cane dorme fuori.", "Il contabile capì perché mi ero nascosto."] };
function targetSection(form: QabForm, code: "naming" | "repetition" | "reading", title: string, instructions: string, targets: readonly string[]): QabSection { return { code, title, instructions, items: scoredItems(form, code === "naming" ? "naming" : code, targets) }; }
function motorSpeech(form: QabForm): QabSection { return { code: "motorSpeech", title: "Articolazione / Fonazione", instructions: "Eseguire rapidamente i compiti a, c e d; sostenere la vocale fino a 15 secondi; contare a ritmo normale. I punteggi sono giudizi complessivi.", prompts: ["lingua da una parte all’altra", "aaaaaah (qualità della voce)", "pʌ pʌ pʌ pʌ pʌ (velocità/ritmo)", "pʌtʌkʌ pʌtʌkʌ pʌtʌkʌ (velocità/ritmo)", "Conta fino a 10."], items: scoredItems(form, "motor-speech", ["Disartria", "Aprassia articolatoria"]) }; }

function createForm(form: QabForm): QabFormDefinition {
  const sections: Record<QabSectionCode, QabSection> = {
    awareness: awareness(form), spontaneousSpeech: spontaneousSpeech(form), wordComprehension: wordComprehension(form), sentenceComprehension: sentenceComprehension(form),
    naming: targetSection(form, "naming", "Denominazione di figure", "Mostrare la scheda 5 e chiedere «Cos’è questo? E questo?».", namingTargets[form]),
    repetition: targetSection(form, "repetition", "Ripetizioni", "Presentare ogni parola o frase dicendo «Ripeti dopo di me».", repetitionTargets[form]),
    reading: targetSection(form, "reading", "Lettura a voce alta", "Mostrare la scheda 6 e dire «Leggi queste parole e frasi ad alta voce».", readingTargets[form]),
    motorSpeech: motorSpeech(form),
  };
  return { form, sections };
}

export const QAB_ITALIAN_FORMS = [createForm(1), createForm(2), createForm(3)] as const;
export const getQabItalianForm = (form: QabForm) => QAB_ITALIAN_FORMS.find((entry) => entry.form === form)!;

const CARD_PURPOSES = [
  ["Descrizione di due scene", "spontaneousSpeech"], ["Comprensione di parole: relazioni semantiche", "wordComprehension"],
  ["Comprensione di parole: relazioni fonologiche", "wordComprehension"], ["Supporto visivo Sì/No", "sentenceComprehension"],
  ["Denominazione di sei figure", "naming"], ["Lettura di quattro parole e due frasi", "reading"],
] as const;
export const QAB_ITALIAN_STIMULUS_CARDS: readonly QabStimulusCard[] = ([1, 2, 3] as const).flatMap((form) => CARD_PURPOSES.map(([purpose, associatedSection], index) => ({ form, cardNumber: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6, purpose, associatedSection, assetPath: `/clinical-tools/qab-it/stimuli/module-${form}-card-${index + 1}.png`, assetAvailable: true, source: "ItalianQAB_StimulusCards.pdf", sourcePage: ({ 1: 2, 2: 9, 3: 16 } as const)[form] + index })));

export const QAB_ITALIAN_ATTRIBUTION: QabAttribution = {
  title: "Test Rapido di Valutazione dell’Afasia / Italian Quick Aphasia Battery",
  adaptationAuthors: ["Whitney Anne Postman", "Maria Teresa Bonfatti Sabbioni", "Reese Elledge", "Elena Barbieri", "Rossella Raggi"],
  originalReference: "Quick Aphasia Battery, Stephen M. Wilson et al.", publisher: "AphasiaLab",
  license: "Creative Commons Attribution License", sourceUrl: "https://www.aphasialab.org/qab/",
};

// Editorial source policy: PDF scoresheet wins for wording; Excel is used only for formulas.
export const QAB_ITALIAN_EDITORIAL_DISCREPANCIES = [
  { form: 1, itemId: "qab1-awareness-a", pdf: "clinicamente stabile", excel: "clinicamente tranquillo/a" },
  { form: 1, itemId: "qab1-sentence-comprehension-d", pdf: "I bambini sono sorvegliati dalla babysitter?", excel: "refuso di maiuscola in sorvegliati" },
  { form: 1, itemId: "qab1-sentence-comprehension-h", pdf: "Se dico che fumavo, pensi che io fumi adesso?", excel: "testo duplicato «fumi fumi»" },
  { form: 3, itemId: "qab3-sentence-comprehension-c", pdf: "Ti lavi i denti con il pettine?", excel: "forma plurale di cortesia" },
  { form: 3, itemId: "qab3-sentence-comprehension-d", pdf: "I bambini vengono sgridati dai genitori?", excel: "I bambini vengono nominati dai genitori?" },
  { form: 3, itemId: "qab3-sentence-comprehension-e", pdf: "Scatti le foto con una macchina fotografica?", excel: "forma plurale di cortesia" },
  { form: 3, itemId: "qab3-sentence-comprehension-l", pdf: "Se ti dico che bevevo caffè, pensi che lo beva adesso?", excel: "forma plurale di cortesia" },
] as const;
