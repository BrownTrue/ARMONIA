import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AssessmentPrintField, AssessmentPrintModel } from "./assessment-print-model.ts";

const fontBase = typeof window === "undefined" ? `${process.cwd()}/lib/economic-documents/fonts` : "/resources/fonts";
Font.register({ family: "Inter", fonts: [
  { src: `${fontBase}/Inter-Regular.woff`, fontWeight: 400 },
  { src: `${fontBase}/Inter-Bold.woff`, fontWeight: 700 },
] });

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 48, paddingHorizontal: 42, fontFamily: "Inter", color: "#25362e", fontSize: 9.2, lineHeight: 1.45 },
  identity: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#d9e3db", paddingBottom: 12 },
  logoBox: { width: 54, height: 34, marginRight: 12, alignItems: "flex-start", justifyContent: "center" },
  logo: { maxWidth: 52, maxHeight: 32, objectFit: "contain" },
  mark: { width: 28, height: 28, borderRadius: 8, paddingTop: 6, backgroundColor: "#55725d", color: "#ffffff", fontSize: 13, fontWeight: 700, textAlign: "center" },
  professional: { fontSize: 10, fontWeight: 700, color: "#273c31" },
  professionalMeta: { marginTop: 2, color: "#68766e", fontSize: 7.7 },
  brand: { marginLeft: "auto", color: "#58725f", fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4 },
  titleBlock: { paddingVertical: 20 },
  kicker: { color: "#55725d", fontSize: 7.7, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" },
  title: { marginTop: 7, fontSize: 23, fontWeight: 700, lineHeight: 1.12, color: "#1d3027" },
  subtitle: { marginTop: 5, color: "#65736c", fontSize: 9.5 },
  patientCard: { flexDirection: "row", borderWidth: 1, borderColor: "#dfe7e1", borderRadius: 10, backgroundColor: "#f6f8f5", paddingVertical: 10, paddingHorizontal: 12, marginBottom: 21 },
  patientCell: { width: "58%" }, dateCell: { width: "42%" },
  metaLabel: { color: "#78847d", fontSize: 6.8, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase" },
  metaValue: { marginTop: 3, color: "#293a31", fontSize: 9.5, fontWeight: 700 },
  section: { marginBottom: 21 },
  sectionHeading: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e3e9e4" },
  sectionNumber: { marginRight: 9, color: "#6e8275", fontSize: 7.5, fontWeight: 700 },
  sectionTitle: { color: "#263a30", fontSize: 13, fontWeight: 700 },
  fields: { flexDirection: "row", flexWrap: "wrap", columnGap: 12 },
  field: { width: "48%", marginBottom: 10 },
  fieldWide: { width: "100%" },
  fieldEmphasis: { width: "100%", borderLeftWidth: 2, borderLeftColor: "#9db3a1", backgroundColor: "#f7f9f6", paddingVertical: 7, paddingHorizontal: 9 },
  fieldLabel: { color: "#718078", fontSize: 6.9, fontWeight: 700, letterSpacing: 0.45, textTransform: "uppercase" },
  fieldValue: { marginTop: 3.5, color: "#2c3d34", fontSize: 9.1, lineHeight: 1.52 },
  listItem: { flexDirection: "row", marginTop: 2 }, listMark: { width: 9, color: "#65806c" }, listText: { flexGrow: 1 },
  group: { marginTop: 4, marginBottom: 13, borderWidth: 1, borderColor: "#e0e7e2", borderRadius: 9, padding: 11 },
  groupHeading: { flexDirection: "row", alignItems: "center", marginBottom: 9 }, groupNumber: { marginRight: 7, color: "#65806c", fontSize: 7.2, fontWeight: 700 }, groupTitle: { color: "#2d4337", fontSize: 10.5, fontWeight: 700 },
  subsectionTitle: { marginTop: 3, marginBottom: 7, color: "#50665a", fontSize: 8.2, fontWeight: 700 },
  footer: { position: "absolute", left: 42, right: 42, bottom: 21, flexDirection: "row", borderTopWidth: 1, borderTopColor: "#d9e3db", paddingTop: 5, color: "#7b8780", fontSize: 6.8 },
  footerLabel: { marginLeft: "auto" },
});

const el = React.createElement;

export function assessmentPdfDocument(model: AssessmentPrintModel, logoData?: string) {
  return el(Document, { title: model.title, author: model.professionalName, subject: "Valutazione clinica ARMONIA" },
    el(Page, { size: "A4", style: styles.page },
      identity(model, logoData),
      el(View, { style: styles.titleBlock }, el(Text, { style: styles.kicker }, cleanText(model.pathwayTitle)), el(Text, { style: styles.title }, cleanText(model.title)), el(Text, { style: styles.subtitle }, cleanText(model.subtitle))),
      el(View, { style: styles.patientCard, wrap: false }, metaCell("Paziente", model.patientName, styles.patientCell), metaCell("Data clinica", model.clinicalDate, styles.dateCell)),
      ...model.sections.map((section) => el(View, { key: section.code, style: styles.section },
        el(View, { style: styles.sectionHeading, minPresenceAhead: 75 }, el(Text, { style: styles.sectionNumber }, section.number), el(Text, { style: styles.sectionTitle }, cleanText(section.title))),
        section.fields.length ? fields(section.fields) : null,
        ...section.groups.map((group) => el(View, { key: group.code, style: styles.group },
          el(View, { style: styles.groupHeading, minPresenceAhead: 65 }, group.number ? el(Text, { style: styles.groupNumber }, group.number) : null, el(Text, { style: styles.groupTitle }, cleanText(group.title))),
          ...group.sections.map((subsection) => el(View, { key: subsection.code }, subsection.title ? el(Text, { style: styles.subsectionTitle, minPresenceAhead: 45 }, cleanText(subsection.title)) : null, fields(subsection.fields))),
        )),
      )),
      el(View, { fixed: true, style: styles.footer }, el(Text, null, `Generato con Armonia il ${cleanText(model.generatedOn)}`), el(Text, { style: styles.footerLabel }, cleanText(model.footerLabel))),
    ),
  );
}

function identity(model: AssessmentPrintModel, logoData?: string) {
  return el(View, { style: styles.identity, wrap: false },
    el(View, { style: styles.logoBox }, logoData ? el(Image, { src: logoData, style: styles.logo }) : el(Text, { style: styles.mark }, "A")),
    el(View, null, el(Text, { style: styles.professional }, cleanText(model.professionalName)), model.profession ? el(Text, { style: styles.professionalMeta }, cleanText(model.profession)) : null, model.studio ? el(Text, { style: styles.professionalMeta }, cleanText(model.studio)) : null),
    el(Text, { style: styles.brand }, "ARMONIA"),
  );
}

function metaCell(label: string, value: string, style: typeof styles.patientCell) {
  return el(View, { style }, el(Text, { style: styles.metaLabel }, label), el(Text, { style: styles.metaValue }, cleanText(value)));
}

function fields(entries: AssessmentPrintField[]) {
  return el(View, { style: styles.fields }, ...entries.map((entry, index) => {
    const long = entry.emphasis || isLong(entry.value);
    const style = entry.emphasis ? styles.fieldEmphasis : long ? styles.fieldWide : styles.field;
    return el(View, { key: `${entry.label}-${index}`, style, wrap: long }, el(Text, { style: styles.fieldLabel }, cleanText(entry.label)), Array.isArray(entry.value)
      ? el(View, { style: styles.fieldValue }, ...entry.value.map((value, valueIndex) => el(View, { key: `${value}-${valueIndex}`, style: styles.listItem }, el(Text, { style: styles.listMark }, "-"), el(Text, { style: styles.listText }, cleanText(value)))))
      : el(Text, { style: styles.fieldValue }, cleanText(entry.value)));
  }));
}

function isLong(value: string | string[]) {
  return Array.isArray(value) ? value.length > 3 || value.join(" ").length > 120 : value.length > 180 || value.includes("\n");
}

function cleanText(value: string) {
  return value.replace(/[\u2012-\u2015]/g, "-").replace(/\u00a0/g, " ");
}
