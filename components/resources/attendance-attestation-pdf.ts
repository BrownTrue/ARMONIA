import { attestationDocumentPdf } from "./attestation-document-pdf.ts";
import { formatItalianDate, type AttendanceAttestationModel } from "../../lib/professional-documents/attendance-attestation.ts";

export function attendanceAttestationPdfDocument(model: AttendanceAttestationModel) {
  return attestationDocumentPdf({
    title: "Attestazione di presenza",
    subject: "Attestazione di presenza",
    patientName: model.patientName,
    paragraphs: [
      `Si attesta che ${model.patientName} ha effettuato una seduta logopedica in data ${formatItalianDate(model.sessionDate)}, dalle ore ${model.startTime} alle ore ${model.endTime}, presso ${model.location}.`,
      "Il presente documento viene rilasciato su richiesta dell’interessato per gli usi consentiti.",
    ],
    issueHeading: [model.issuePlace, formatItalianDate(model.issueDate)].filter(Boolean).join(", "),
    professional: model.professional,
    logoSrc: model.logoSrc,
  });
}
