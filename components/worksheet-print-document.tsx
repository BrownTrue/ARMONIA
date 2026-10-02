import type { ComponentType } from "react";
import type { MinimalPairsPrintBlock as MinimalPairsBlockModel, PictureNamingPrintBlock as PictureBlockModel, ReadingComprehensionPrintBlock as ReadingBlockModel, RepetitionPrintBlock as RepetitionBlockModel, SentenceReadingPrintBlock as SentenceBlockModel, WorksheetPrintBlock, WorksheetPrintModel } from "@/lib/exercise-lab/worksheet-print";

type BlockProps<T extends WorksheetPrintBlock> = { block: T };
type BlockComponent = ComponentType<BlockProps<never>>;

export const worksheetPrintBlockComponents: Record<WorksheetPrintBlock["kind"], BlockComponent> = {
  picture_naming: PictureNamingPrintBlock,
  minimal_pairs: MinimalPairsPrintBlock,
  repetition: RepetitionPrintBlock,
  reading_comprehension: ReadingComprehensionPrintBlock,
  sentence_reading: SentenceReadingPrintBlock,
};

export function WorksheetPrintDocument({ model }: { model: WorksheetPrintModel }) {
  return <article className="worksheet-print-document" aria-label={`Scheda stampabile, versione ${model.variant === "patient" ? "paziente" : "terapista"}`}>
    <header className="worksheet-print-header"><div className="worksheet-print-brand"><img src="/branding/logo-mark.svg" alt="" /><span>ARMONIA</span><small>{model.variant === "patient" ? "Versione paziente" : "Versione terapista"}</small></div><h1>{model.title}</h1>{model.instructions && <p>{model.instructions}</p>}</header>
    <ol className="worksheet-print-blocks">{model.blocks.map((block, index) => <li key={`${block.kind}-${index}`} className="worksheet-print-block"><BlockHeading block={block} number={index + 1} /><PrintBlock block={block} /></li>)}</ol>
    <footer className="worksheet-print-footer">Materiale generato con Armonia</footer>
  </article>;
}

function PrintBlock({ block }: { block: WorksheetPrintBlock }) {
  const Renderer = worksheetPrintBlockComponents[block.kind] as ComponentType<{ block: WorksheetPrintBlock }>;
  if (!Renderer) return <p className="worksheet-print-error">Attività non disponibile per la stampa.</p>;
  return <Renderer block={block} />;
}

function BlockHeading({ block, number }: { block: WorksheetPrintBlock; number: number }) {
  return <header className="worksheet-print-block-heading"><span className={`worksheet-print-chapter worksheet-print-chapter-${block.tone}`}>{number}</span><div><h2>{block.title}</h2>{block.instructions && <p>{block.instructions}</p>}</div></header>;
}

function PictureNamingPrintBlock({ block }: BlockProps<PictureBlockModel>) {
  return <div className={`worksheet-print-picture-grid worksheet-print-picture-count-${Math.min(block.items.length, 7)}`}>{block.items.map((item, index) => <figure key={`${item.imagePath}-${index}`} className="worksheet-print-picture"><img src={item.imagePath} alt={item.altText} />{item.label && <figcaption>{item.label}</figcaption>}</figure>)}</div>;
}

function MinimalPairsPrintBlock({ block }: BlockProps<MinimalPairsBlockModel>) {
  return <div className="worksheet-print-pairs">{block.items.map((item, index) => <article key={`${item.wordA}-${item.wordB}-${index}`} className="worksheet-print-pair"><div className="worksheet-print-pair-side">{item.imagePathA && <img src={item.imagePathA} alt="" />}<strong>{item.wordA}</strong></div><span className="worksheet-print-pair-arrow" aria-hidden="true">↔</span><div className="worksheet-print-pair-side">{item.imagePathB && <img src={item.imagePathB} alt="" />}<strong>{item.wordB}</strong></div>{item.contrast && <small>{item.contrast}</small>}</article>)}</div>;
}

function RepetitionPrintBlock({ block }: BlockProps<RepetitionBlockModel>) {
  return <div className="worksheet-print-repetition">{block.words.length > 0 && <ItemSection title={block.nonwords.length ? "Parole" : undefined} items={block.words} />}{block.nonwords.length > 0 && <ItemSection title={block.words.length ? "Non-parole" : undefined} items={block.nonwords} />}</div>;
}

function SentenceReadingPrintBlock({ block }: BlockProps<SentenceBlockModel>) {
  return <ol className="worksheet-print-sentences">{block.sentences.map((sentence, index) => <li key={`${sentence}-${index}`}><ItemNumber value={index + 1} /><span>{sentence}</span></li>)}</ol>;
}

function ReadingComprehensionPrintBlock({ block }: BlockProps<ReadingBlockModel>) {
  return <div className="worksheet-print-readings">{block.passages.map((passage, passageIndex) => <article key={`${passage.title}-${passageIndex}`} className="worksheet-print-reading"><h3>{passage.title}</h3><p className="worksheet-print-passage">{passage.text}</p><ol className="worksheet-print-questions">{passage.questions.map((question, index) => <li key={`${question.prompt}-${index}`}><div><ItemNumber value={index + 1} /><span>{question.prompt}</span></div>{question.suggestedAnswer && <p><strong>Risposta suggerita</strong>{question.suggestedAnswer}</p>}</li>)}</ol></article>)}</div>;
}

function ItemSection({ title, items }: { title?: string; items: string[] }) {
  return <section>{title && <h3>{title}</h3>}<ol className="worksheet-print-items">{items.map((item, index) => <li key={`${item}-${index}`}><ItemNumber value={index + 1} /><span>{item}</span></li>)}</ol></section>;
}

function ItemNumber({ value }: { value: number }) { return <span className="worksheet-print-item-number">{value}</span>; }
