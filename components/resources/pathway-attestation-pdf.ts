import { attestationDocumentPdf } from "./attestation-document-pdf.ts";
import { formatItalianDate } from "../../lib/professional-documents/attendance-attestation.ts";
import { pathwayAttestationParagraphs, type PathwayAttestationModel } from "../../lib/professional-documents/pathway-attestation.ts";

export function pathwayAttestationPdfDocument(model: PathwayAttestationModel) {
  return attestationDocumentPdf({
    title: "Attestazione di percorso logopedico",
    subject: "Attestazione di percorso logopedico",
    patientName: model.patientName,
    paragraphs: pathwayAttestationParagraphs(model),
    issueHeading: [model.issuePlace, formatItalianDate(model.issueDate)].filter(Boolean).join(", "),
    professional: model.professional,
    logoSrc: model.logoSrc,
  });
}
