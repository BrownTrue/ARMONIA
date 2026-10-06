import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { assertWorksheetPdfImages, type WorksheetPdfImageSources } from "./worksheet-pdf.ts";
import type { WorksheetPrintBlock, WorksheetPrintModel } from "./worksheet-print.ts";

const fontBase = typeof window === "undefined" ? `${process.cwd()}/lib/economic-documents/fonts` : "/resources/fonts";
Font.register({ family: "Inter", fonts: [
  { src: `${fontBase}/Inter-Regular.woff`, fontWeight: 400 },
  { src: `${fontBase}/Inter-Bold.woff`, fontWeight: 700 },
] });

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 48, paddingHorizontal: 44, fontFamily: "Inter", color: "#24352f", fontSize: 10, lineHeight: 1.45 },
  header: { borderBottomWidth: 1, borderBottomColor: "#d8e2da", paddingBottom: 15, marginBottom: 24 }, brandRow: { flexDirection: "row", alignItems: "center" }, mark: { width: 18, height: 18, borderRadius: 5, backgroundColor: "#55725d", marginRight: 7 }, brand: { color: "#46654c", fontSize: 8, fontWeight: 700, letterSpacing: 1.6 }, variant: { marginLeft: "auto", color: "#748079", fontSize: 8 }, title: { marginTop: 13, color: "#1f3028", fontSize: 23, fontWeight: 700, lineHeight: 1.12 }, instructions: { marginTop: 7, color: "#5d6d64", fontSize: 10.5, lineHeight: 1.5 },
  block: { marginBottom: 26 }, blockHeading: { flexDirection: "row", alignItems: "flex-start", marginBottom: 13 }, chapter: { width: 28, height: 28, borderRadius: 14, textAlign: "center", paddingTop: 7, fontSize: 10, fontWeight: 700, marginRight: 10 }, headingCopy: { flexGrow: 1, minWidth: 0 }, blockTitle: { color: "#263b31", fontSize: 15, fontWeight: 700, lineHeight: 1.2 }, blockInstructions: { marginTop: 4, color: "#66736c", fontSize: 9, lineHeight: 1.45 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pictureCard: { width: "48%", minHeight: 142, borderWidth: 1, borderColor: "#e4eae6", borderRadius: 10, padding: 9, alignItems: "center", justifyContent: "center" }, picture: { width: "100%", height: 110, objectFit: "contain" }, pictureLabel: { marginTop: 6, color: "#33463d", fontSize: 10, fontWeight: 700 },
  pairCard: { width: "48%", borderWidth: 1, borderColor: "#e1e8e3", borderRadius: 10, padding: 10 }, pairRow: { flexDirection: "row", alignItems: "center" }, pairSide: { width: "44%", alignItems: "center" }, pairImage: { width: "100%", height: 58, objectFit: "contain" }, pairWord: { marginTop: 4, fontSize: 12, fontWeight: 700 }, pairArrow: { width: "12%", color: "#718078", textAlign: "center", fontSize: 12 }, pairContrast: { borderTopWidth: 1, borderTopColor: "#edf1ee", marginTop: 7, paddingTop: 5, color: "#718078", textAlign: "center", fontSize: 7.5 },
  subsection: { marginBottom: 13 }, subsectionTitle: { marginBottom: 7, color: "#475950", fontSize: 8.5, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase" }, item: { width: "48%", flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: "#e7ece8", borderRadius: 8, padding: 9 }, itemNumber: { width: 18, height: 18, borderRadius: 9, paddingTop: 4, marginRight: 8, backgroundColor: "#f0f3f1", color: "#405149", textAlign: "center", fontSize: 7.5, fontWeight: 700 }, itemText: { flexGrow: 1, fontSize: 11, fontWeight: 700, lineHeight: 1.4 }, sentenceItem: { width: "100%" },
  reading: { marginBottom: 18 }, passageTitle: { marginBottom: 8, color: "#2f4639", fontSize: 12.5, fontWeight: 700 }, passage: { fontSize: 10.5, lineHeight: 1.65 }, question: { borderTopWidth: 1, borderTopColor: "#e5ebe6", marginTop: 11, paddingTop: 8 }, questionRow: { flexDirection: "row", alignItems: "flex-start" }, questionText: { flexGrow: 1, fontSize: 10, lineHeight: 1.45 }, answer: { marginTop: 7, marginLeft: 26, borderLeftWidth: 2, borderLeftColor: "#b8c9ba", paddingVertical: 5, paddingHorizontal: 8, backgroundColor: "#f6f8f5", color: "#4d5f55", fontSize: 8.5 }, answerLabel: { color: "#46654c", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  footer: { position: "absolute", left: 44, right: 44, bottom: 22, borderTopWidth: 1, borderTopColor: "#d8e2da", paddingTop: 5, flexDirection: "row", color: "#7a8780", fontSize: 7.5 }, pageNumber: { marginLeft: "auto" },
});

const toneColors = { lavender: "#eeeafb", blue: "#e7f1f7", amber: "#faeedf", rose: "#f8e8ec", sage: "#e8f1e7" } as const;
const el = React.createElement;

export function worksheetPdfDocument(model: WorksheetPrintModel, imageSources: WorksheetPdfImageSources) {
  assertWorksheetPdfImages(model, imageSources);
  return el(Document, { title: model.title, author: "ARMONIA", subject: "Scheda di attività" },
    el(Page, { size: "A4", style: styles.page },
      el(View, { style: styles.header }, el(View, { style: styles.brandRow }, el(View, { style: styles.mark }), el(Text, { style: styles.brand }, "ARMONIA"), el(Text, { style: styles.variant }, model.variant === "patient" ? "Versione paziente" : "Versione terapista")), el(Text, { style: styles.title }, model.title), model.instructions ? el(Text, { style: styles.instructions }, model.instructions) : null),
      ...model.blocks.map((block, index) => el(View, { key: `${block.kind}-${index}`, style: styles.block }, el(View, { style: styles.blockHeading, minPresenceAhead: 80 }, el(Text, { style: [styles.chapter, { backgroundColor: toneColors[block.tone] }] }, String(index + 1)), el(View, { style: styles.headingCopy }, el(Text, { style: styles.blockTitle }, block.title), block.instructions ? el(Text, { style: styles.blockInstructions }, block.instructions) : null)), pdfBlock(block, imageSources))),
      el(View, { fixed: true, style: styles.footer }, el(Text, null, "Materiale generato con Armonia"), el(Text, { style: styles.pageNumber, render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` })),
    ),
  );
}

function pdfBlock(block: WorksheetPrintBlock, images: WorksheetPdfImageSources): React.ReactNode {
  if (block.kind === "picture_naming") return el(View, { style: styles.grid }, ...block.items.map((item, index) => el(View, { key: `${item.imagePath}-${index}`, wrap: false, style: styles.pictureCard }, el(Image, { src: images[item.imagePath], style: styles.picture }), item.label ? el(Text, { style: styles.pictureLabel }, item.label) : null)));
  if (block.kind === "minimal_pairs") return el(View, { style: styles.grid }, ...block.items.map((item, index) => el(View, { key: `${item.wordA}-${item.wordB}-${index}`, wrap: false, style: styles.pairCard }, el(View, { style: styles.pairRow }, el(View, { style: styles.pairSide }, item.imagePathA ? el(Image, { src: images[item.imagePathA], style: styles.pairImage }) : null, el(Text, { style: styles.pairWord }, item.wordA)), el(Text, { style: styles.pairArrow }, "—"), el(View, { style: styles.pairSide }, item.imagePathB ? el(Image, { src: images[item.imagePathB], style: styles.pairImage }) : null, el(Text, { style: styles.pairWord }, item.wordB))), item.contrast ? el(Text, { style: styles.pairContrast }, item.contrast.replaceAll("↔", "—")) : null)));
  if (block.kind === "repetition") return el(View, null, block.words.length ? pdfItemSection(block.nonwords.length ? "Parole" : undefined, block.words) : null, block.nonwords.length ? pdfItemSection(block.words.length ? "Non-parole" : undefined, block.nonwords) : null);
  if (block.kind === "sentence_reading") return el(View, { style: styles.grid }, ...block.sentences.map((sentence, index) => pdfItem(sentence, index + 1, true)));
  return el(View, null, ...block.passages.map((passage, passageIndex) => el(View, { key: `${passage.title}-${passageIndex}`, style: styles.reading }, el(Text, { style: styles.passageTitle, minPresenceAhead: 70 }, passage.title), el(Text, { style: styles.passage }, passage.text), ...passage.questions.map((question, index) => el(View, { key: `${question.prompt}-${index}`, wrap: false, style: styles.question }, el(View, { style: styles.questionRow }, el(Text, { style: styles.itemNumber }, String(index + 1)), el(Text, { style: styles.questionText }, question.prompt)), question.suggestedAnswer ? el(View, { style: styles.answer }, el(Text, { style: styles.answerLabel }, "Risposta suggerita"), el(Text, null, question.suggestedAnswer)) : null)))));
}

function pdfItemSection(title: string | undefined, items: string[]) {
  return el(View, { style: styles.subsection }, title ? el(Text, { style: styles.subsectionTitle }, title) : null, el(View, { style: styles.grid }, ...items.map((item, index) => pdfItem(item, index + 1, false))));
}

function pdfItem(text: string, number: number, fullWidth: boolean) {
  return el(View, { key: `${text}-${number}`, wrap: false, style: [styles.item, ...(fullWidth ? [styles.sentenceItem] : [])] }, el(Text, { style: styles.itemNumber }, String(number)), el(Text, { style: styles.itemText }, text));
}
