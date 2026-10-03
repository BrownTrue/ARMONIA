import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { professionalAddress, professionalExtraDetails } from "../../lib/professional-documents/attendance-attestation.ts";
import type { ProfessionalDocumentSnapshot } from "../../lib/economic-documents.ts";

const fontBase = typeof window === "undefined" ? `${process.cwd()}/lib/economic-documents/fonts` : "/resources/fonts";
Font.register({ family: "Inter", fonts: [
  { src: `${fontBase}/Inter-Regular.woff`, fontWeight: 400 },
  { src: `${fontBase}/Inter-Bold.woff`, fontWeight: 700 },
] });

const styles = StyleSheet.create({
  page: { paddingTop: 56, paddingBottom: 58, paddingHorizontal: 58, fontFamily: "Inter", color: "#202824", fontSize: 11, lineHeight: 1.6 },
  header: { flexDirection: "row", alignItems: "flex-start", borderBottomWidth: 0.8, borderBottomColor: "#cfd8d3", paddingBottom: 18 },
  logoBox: { width: 92, height: 58, marginRight: 18, justifyContent: "center", alignItems: "center" },
  logo: { maxWidth: 92, maxHeight: 58, objectFit: "contain" },
  identity: { flexGrow: 1, minWidth: 0 },
  professionalName: { fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#183f32" },
  professionalLine: { marginTop: 3, color: "#4d5d55" },
  professionalSmall: { marginTop: 5, color: "#68766f", fontSize: 8.5, lineHeight: 1.4 },
  title: { marginTop: 58, textAlign: "center", fontFamily: "Inter", fontWeight: 700, fontSize: 20 },
  body: { marginTop: 42, fontSize: 12, lineHeight: 1.75, textAlign: "justify" },
  paragraph: { marginBottom: 20 },
  closing: { marginTop: 42 },
  signature: { marginTop: 54, marginLeft: "auto", width: 220, textAlign: "center" },
  signatureName: { fontFamily: "Inter", fontWeight: 700, fontSize: 11 },
  signatureLine: { marginTop: 46, borderTopWidth: 0.8, borderTopColor: "#89958f", paddingTop: 5, fontSize: 8, color: "#68766f" },
});

export type AttestationDocumentModel = {
  title: string;
  subject: string;
  patientName: string;
  paragraphs: string[];
  issueHeading: string;
  professional: ProfessionalDocumentSnapshot;
  logoSrc?: string;
};

const el = React.createElement;

export function attestationDocumentPdf(model: AttestationDocumentModel) {
  const professionalName = model.professional.professionalName || [model.professional.firstName, model.professional.lastName].filter(Boolean).join(" ");
  const address = professionalAddress(model.professional);
  const extra = professionalExtraDetails({ ...model.professional, address: undefined, postalCode: undefined, city: undefined, province: undefined, country: undefined, email: undefined });
  return el(Document, { title: `${model.title} - ${model.patientName}`, author: professionalName || "Logopedista", subject: model.subject },
    el(Page, { size: "A4", style: styles.page },
      el(View, { style: styles.header },
        model.logoSrc ? el(View, { style: styles.logoBox }, el(Image, { src: model.logoSrc, style: styles.logo })) : null,
        el(View, { style: styles.identity },
          professionalName ? el(Text, { style: styles.professionalName }, professionalName) : null,
          el(Text, { style: styles.professionalLine }, model.professional.profession || "Logopedista"),
          model.professional.studio ? el(Text, { style: styles.professionalLine }, model.professional.studio) : null,
          address ? el(Text, { style: styles.professionalSmall }, address) : null,
          extra ? el(Text, { style: styles.professionalSmall }, extra) : null,
          model.professional.email ? el(Text, { style: styles.professionalSmall }, model.professional.email) : null,
        ),
      ),
      el(Text, { style: styles.title }, model.title),
      el(View, { style: styles.body }, ...model.paragraphs.map((paragraph, index) => el(Text, { key: String(index), style: index < model.paragraphs.length - 1 ? styles.paragraph : undefined }, paragraph))),
      el(Text, { style: styles.closing }, model.issueHeading),
      el(View, { style: styles.signature },
        professionalName ? el(Text, { style: styles.signatureName }, professionalName) : null,
        el(Text, null, "Logopedista"),
        extra ? el(Text, { style: styles.professionalSmall }, extra) : null,
        el(Text, { style: styles.signatureLine }, "Firma"),
      ),
    ),
  );
}
