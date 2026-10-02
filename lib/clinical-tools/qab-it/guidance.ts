import {
  QAB_ITALIAN_ADMINISTRATION_RULES,
  QAB_ITALIAN_STIMULUS_CARDS,
  getQabItalianForm,
} from "./content.ts";
import type { QabForm, QabScore, QabScoredItem, QabSectionCode, QabStimulusCard } from "./types.ts";

export const QAB_SECTION_LABELS: Record<QabSectionCode, string> = {
  awareness: "Consapevolezza",
  spontaneousSpeech: "Eloquio spontaneo",
  wordComprehension: "Comprensione parole",
  sentenceComprehension: "Comprensione frasi",
  naming: "Denominazione",
  repetition: "Ripetizione",
  reading: "Lettura",
  motorSpeech: "Articolazione / Fonazione",
};

export type QabSectionGuide = {
  readonly do: readonly string[];
  readonly say: readonly string[];
  readonly show: readonly string[];
  readonly scoring: readonly string[];
  readonly notes: readonly string[];
};

export function getQabCardsForSection(form: QabForm, sectionCode: QabSectionCode): readonly QabStimulusCard[] {
  return QAB_ITALIAN_STIMULUS_CARDS.filter((card) => card.form === form && card.associatedSection === sectionCode);
}

export function getQabCardForItem(form: QabForm, sectionCode: QabSectionCode, itemIndex: number): QabStimulusCard | undefined {
  const cards = getQabCardsForSection(form, sectionCode);
  if (sectionCode === "wordComprehension") return cards[itemIndex < 4 ? 0 : 1];
  return cards[0];
}

export function getQabSectionGuide(form: QabForm, sectionCode: QabSectionCode): QabSectionGuide {
  const section = getQabItalianForm(form).sections[sectionCode];
  const cards = getQabCardsForSection(form, sectionCode);
  const allowed = [...new Set(section.items.flatMap((item) => item.allowedScores))].sort();
  const base: QabSectionGuide = {
    do: [section.instructions],
    say: section.items.slice(0, 3).map((item) => item.prompt || item.label),
    show: cards.length ? cards.map((card) => `Carta ${card.cardNumber} — ${card.purpose}`) : ["Nessuna carta stimolo prevista."],
    scoring: [`Punteggi ammessi nella sezione: ${allowed.join(", ")}.`, QAB_ITALIAN_ADMINISTRATION_RULES[0]],
    notes: [QAB_ITALIAN_ADMINISTRATION_RULES[1], QAB_ITALIAN_ADMINISTRATION_RULES[2], QAB_ITALIAN_ADMINISTRATION_RULES[3]],
  };

  if (sectionCode === "spontaneousSpeech") {
    return {
      ...base,
      do: ["Conversare per almeno tre minuti.", "Mostrare la Carta 1 e raccogliere la descrizione delle due scene.", "Considerare anche l’eloquio spontaneo prodotto durante la valutazione."],
      say: section.prompts?.slice(0, 12) || [],
      scoring: ["Valutare separatamente le 10 dimensioni canoniche su scala 0–4.", "Usare una delle opzioni «non valutabile» canoniche quando non è possibile formulare il giudizio."],
      notes: section.nonScorableOptions || [],
    };
  }
  if (sectionCode === "wordComprehension") {
    return {
      ...base,
      do: ["Usare la Carta 2 per i primi quattro item semantici e la Carta 3 per i quattro item fonologici.", "Chiedere al paziente di indicare la figura nominata."],
      say: ["Mostrami il/la…"],
      scoring: ["4 — risposta corretta senza latenza (entro 3 secondi).", "3 — risposta corretta con latenza (tra 3 e 6 secondi).", "1 — scelta di un distrattore correlato indicato nell’item.", "0 — risposta errata o assente.", "Il punteggio 2 non è previsto in questa sezione."],
    };
  }
  if (sectionCode === "sentenceComprehension") {
    return { ...base, say: ["Rispondi sì o no.", ...section.items.slice(0, 2).map((item) => item.prompt || item.label)] };
  }
  if (sectionCode === "naming") return { ...base, say: ["Cos’è questo? E questo?"] };
  if (sectionCode === "repetition") return { ...base, say: ["Ripeti dopo di me."] };
  if (sectionCode === "reading") return { ...base, say: ["Leggi queste parole e frasi ad alta voce."] };
  if (sectionCode === "motorSpeech") {
    return {
      ...base,
      do: section.prompts || [],
      say: section.prompts || [],
      scoring: ["Dopo i cinque compiti, formulare i due giudizi complessivi canonici: Disartria e Aprassia articolatoria.", "Per entrambi sono ammessi i punteggi 0–4."],
      notes: [QAB_ITALIAN_ADMINISTRATION_RULES[4]],
    };
  }
  return base;
}

export function getQabScoreLabel(sectionCode: QabSectionCode, item: QabScoredItem, score: QabScore): string {
  if (sectionCode === "wordComprehension") {
    return ({ 0: "Errata o assente", 1: "Distrattore correlato", 3: "Corretta con latenza", 4: "Corretta senza latenza" } as const)[score as 0 | 1 | 3 | 4];
  }
  if (sectionCode === "spontaneousSpeech") return ({ 0: "Grave", 1: "Marcato", 2: "Moderato", 3: "Lieve", 4: "Normale" } as const)[score];
  if (score === 3) return "Risposta corretta con latenza, quando applicabile";
  return `Valore ${score} previsto dallo scoresheet`;
}
