import React from "react";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { IssuanceReservation } from "./issuance";

Font.register({ family: "Inter", fonts: [
  { src: path.join(process.cwd(), "lib/economic-documents/fonts/Inter-Regular.woff"), fontWeight: 400 },
  { src: path.join(process.cwd(), "lib/economic-documents/fonts/Inter-Bold.woff"), fontWeight: 700 },
] });

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 50, paddingHorizontal: 46, fontFamily: "Inter", fontSize: 9.5, color: "#24312b" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#d9e2dd", paddingBottom: 18 },
  brand: { flexDirection: "row", width: "60%" },
  professionalDetails: { flexDirection: "column", flexGrow: 1, minWidth: 0 },
  logoBox: { width: 82, height: 54, marginRight: 14, alignItems: "center", justifyContent: "center" },
  logo: { maxWidth: 82, maxHeight: 54, objectFit: "contain" },
  professionalName: { fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: "#173f32" },
  muted: { marginTop: 3, color: "#65746d", lineHeight: 1.35 },
  titleBox: { width: "35%", textAlign: "right" },
  title: { fontSize: 20, fontFamily: "Inter", fontWeight: 700, color: "#2f6b55", letterSpacing: 1.2 },
  meta: { marginTop: 5, color: "#65746d" },
  recipient: { marginTop: 22, padding: 14, backgroundColor: "#f4f7f5", borderRadius: 3 },
  label: { fontSize: 7.5, fontFamily: "Inter", fontWeight: 700, color: "#718078", letterSpacing: 0.8, textTransform: "uppercase" },
  recipientName: { marginTop: 5, fontSize: 11, fontFamily: "Inter", fontWeight: 700 },
  table: { marginTop: 24 },
  row: { flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: "#e5ebe8", paddingVertical: 8, alignItems: "center" },
  tableHeader: { backgroundColor: "#edf3ef", borderBottomColor: "#c8d7cf", paddingVertical: 7 },
  date: { width: "16%" }, description: { width: "42%", paddingRight: 8 }, quantity: { width: "10%", textAlign: "center" }, amount: { width: "16%", textAlign: "right" }, total: { width: "16%", textAlign: "right" },
  headerText: { fontSize: 7.5, fontFamily: "Inter", fontWeight: 700, color: "#53635b", textTransform: "uppercase" },
  totals: { marginTop: 16, marginLeft: "auto", width: 190, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.2, borderTopColor: "#98b2a5", paddingTop: 9 },
  totalLabel: { fontFamily: "Inter", fontWeight: 700, fontSize: 11 }, totalValue: { fontFamily: "Inter", fontWeight: 700, fontSize: 13, color: "#2f6b55" },
  notes: { marginTop: 22, paddingTop: 12, borderTopWidth: 0.7, borderTopColor: "#d9e2dd", lineHeight: 1.45 },
  footer: { position: "absolute", bottom: 24, left: 46, right: 46, flexDirection: "row", justifyContent: "space-between", color: "#8a9891", fontSize: 7.5 },
});

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const join = (...values: unknown[]) => values.map(text).filter(Boolean).join(" · ");
const date = (value: unknown) => { const raw = text(value); const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw); return match ? `${match[3]}/${match[2]}/${match[1]}` : raw; };
const money = (cents: number, currency: string) => new Intl.NumberFormat("it-IT", { style: "currency", currency: currency || "EUR" }).format(cents / 100);
const el = React.createElement;

export async function renderProformaPdf(reservation: IssuanceReservation, logo?: Uint8Array) {
  const professional = reservation.document.professional_snapshot;
  const recipient = reservation.document.recipient_snapshot;
  const currency = reservation.document.currency_code || "EUR";
  const professionalAddress = join(professional.address, professional.postalCode, professional.city, professional.province, professional.country);
  const recipientAddress = join(recipient.address, recipient.postalCode, recipient.city, recipient.province, recipient.country);
  const professionalTax = join(professional.taxCode && `C.F. ${text(professional.taxCode)}`, professional.vatNumber && `P. IVA ${text(professional.vatNumber)}`);
  const recipientTax = text(recipient.taxCode) ? `C.F. ${text(recipient.taxCode)}` : "";
  const total = reservation.lines.reduce((sum, line) => sum + line.line_total_cents, 0);
  const image = logo ? `data:image/png;base64,${Buffer.from(logo).toString("base64")}` : undefined;
  const stableDate = new Date(`${reservation.attempt.issue_date}T12:00:00.000Z`);

  const document = el(Document, {
    title: `Proforma ${reservation.attempt.document_number}`,
    author: text(professional.professionalName),
    subject: "Proforma",
    creator: "Armonia",
    producer: "Armonia",
    creationDate: stableDate,
    modificationDate: stableDate,
  }, el(Page, { size: "A4", style: styles.page, wrap: true },
    el(View, { style: styles.header, fixed: true },
      el(View, { style: styles.brand },
        image ? el(View, { style: styles.logoBox }, el(Image, { src: image, style: styles.logo })) : null,
        el(View, { style: styles.professionalDetails },
          el(Text, { style: styles.professionalName }, text(professional.professionalName)),
          text(professional.profession) ? el(Text, { style: styles.muted }, text(professional.profession)) : null,
          text(professional.studio) ? el(Text, { style: styles.muted }, text(professional.studio)) : null,
          professionalTax ? el(Text, { style: styles.muted }, professionalTax) : null,
          professionalAddress ? el(Text, { style: styles.muted }, professionalAddress) : null,
          text(professional.email) ? el(Text, { style: styles.muted }, text(professional.email)) : null,
        ),
      ),
      el(View, { style: styles.titleBox },
        el(Text, { style: styles.title }, "PROFORMA"),
        el(Text, { style: styles.meta }, `N. ${reservation.attempt.document_number}`),
        el(Text, { style: styles.meta }, `Data ${date(reservation.attempt.issue_date)}`),
      ),
    ),
    el(View, { style: styles.recipient },
      el(Text, { style: styles.label }, "Destinatario"),
      el(Text, { style: styles.recipientName }, join(recipient.firstName, recipient.lastName)),
      recipientTax ? el(Text, { style: styles.muted }, recipientTax) : null,
      recipientAddress ? el(Text, { style: styles.muted }, recipientAddress) : null,
      text(recipient.administrativeEmail) ? el(Text, { style: styles.muted }, text(recipient.administrativeEmail)) : null,
    ),
    el(View, { style: styles.table },
      el(View, { style: [styles.row, styles.tableHeader], fixed: true },
        el(Text, { style: [styles.date, styles.headerText] }, "Data"), el(Text, { style: [styles.description, styles.headerText] }, "Prestazione"), el(Text, { style: [styles.quantity, styles.headerText] }, "Q.tà"), el(Text, { style: [styles.amount, styles.headerText] }, "Unitario"), el(Text, { style: [styles.total, styles.headerText] }, "Totale"),
      ),
      ...reservation.lines.map((line, index) => el(View, { key: `${line.position}-${index}`, style: styles.row, wrap: false },
        el(Text, { style: styles.date }, date(line.service_date_snapshot)), el(Text, { style: styles.description }, line.description_snapshot), el(Text, { style: styles.quantity }, String(line.quantity)), el(Text, { style: styles.amount }, money(line.unit_amount_cents, currency)), el(Text, { style: styles.total }, money(line.line_total_cents, currency)),
      )),
    ),
    el(View, { style: styles.totals, wrap: false }, el(Text, { style: styles.totalLabel }, "Totale"), el(Text, { style: styles.totalValue }, money(total, currency))),
    text(reservation.document.notes) ? el(View, { style: styles.notes, wrap: false }, el(Text, { style: styles.label }, "Note"), el(Text, { style: { marginTop: 5 } }, text(reservation.document.notes))) : null,
    el(View, { style: styles.footer, fixed: true }, el(Text, null, "Documento generato con Armonia"), el(Text, { render: ({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}` })),
  ));
  return new Uint8Array(await renderToBuffer(document));
}
