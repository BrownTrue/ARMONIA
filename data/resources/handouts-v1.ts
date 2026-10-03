export type ArmoniaHandout = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  version: string;
  audience: string;
  description: string;
  pdfPath: string;
  fileName: string;
};

export const HANDOUTS_V1: readonly ArmoniaHandout[] = [
  {
    id: "voice-hygiene",
    title: "Igiene vocale",
    subtitle: "Indicazioni pratiche per prendersi cura della voce",
    category: "Voce",
    version: "1.0",
    audience: "Pazienti e famiglie",
    description: "Abitudini quotidiane e indicazioni generali per favorire un uso più confortevole ed efficiente della voce.",
    pdfPath: "/resources/handouts/ARMONIA_Handout_Igiene_vocale_v1.0.pdf",
    fileName: "ARMONIA_Handout_Igiene_vocale_v1.0.pdf",
  },
  {
    id: "communication-at-home",
    title: "Strategie di comunicazione a casa",
    subtitle: "Piccole strategie per la vita quotidiana",
    category: "Comunicazione",
    version: "1.0",
    audience: "Famiglie e caregiver",
    description: "Suggerimenti concreti per sostenere la comunicazione nelle interazioni quotidiane, con semplicità e naturalezza.",
    pdfPath: "/resources/handouts/ARMONIA_Handout_Strategie_comunicazione_casa_v1.0.pdf",
    fileName: "ARMONIA_Handout_Strategie_comunicazione_casa_v1.0.pdf",
  },
  {
    id: "exercises-at-home",
    title: "Esercizi logopedici a casa",
    subtitle: "Come renderli più sostenibili nella quotidianità",
    category: "Esercizi a casa",
    version: "1.0",
    audience: "Pazienti, famiglie e caregiver",
    description: "Indicazioni per integrare gli esercizi nella routine con regolarità, serenità e nel rispetto delle consegne ricevute.",
    pdfPath: "/resources/handouts/ARMONIA_Handout_Esercizi_a_casa_v1.0.pdf",
    fileName: "ARMONIA_Handout_Esercizi_a_casa_v1.0.pdf",
  },
  {
    id: "communication-at-school",
    title: "Strategie comunicative a scuola",
    subtitle: "Indicazioni pratiche per scuola e contesti quotidiani",
    category: "Scuola",
    version: "1.0",
    audience: "Insegnanti ed educatori",
    description: "Strategie per facilitare comprensione, partecipazione e tempi di risposta nei contesti educativi.",
    pdfPath: "/resources/handouts/ARMONIA_Handout_Strategie_comunicative_scuola_v1.0.pdf",
    fileName: "ARMONIA_Handout_Strategie_comunicative_scuola_v1.0.pdf",
  },
] as const;
