import Image from "next/image";
import Link from "next/link";

const messages: Record<string, { title: string; text: string; note?: string; cta?: string; href?: string }> = {
  "cross-device": { title: "Email confermata", text: "Il tuo indirizzo email potrebbe essere già stato verificato. Per continuare, accedi ad ARMONIA con l’email e la password che hai scelto.", note: "Se hai iniziato la registrazione su un altro dispositivo, torna lì oppure effettua normalmente l’accesso.", cta: "Vai al login" },
  expired: { title: "Link scaduto", text: "Il link di conferma non è più valido. Torna al login e richiedi un nuovo invio." },
  invalid: { title: "Link non valido", text: "Non è stato possibile verificare questo link. Potrebbe essere già stato usato oppure non essere completo." },
  incomplete: { title: "Conferma incompleta", text: "Il link non contiene le informazioni necessarie per completare la conferma." },
  supabase: { title: "Conferma non riuscita", text: "Si è verificato un problema temporaneo durante la verifica. Riprova dal link ricevuto oppure richiedine uno nuovo." },
  "recovery-expired": { title: "Link scaduto", text: "Il link per reimpostare la password non è più valido.", cta: "Richiedi un nuovo link", href: "/forgot-password" },
  "recovery-invalid": { title: "Link non valido", text: "Il link è già stato usato oppure non è valido.", cta: "Richiedi un nuovo link", href: "/forgot-password" },
  "recovery-incomplete": { title: "Recupero incompleto", text: "Il link non contiene le informazioni necessarie per reimpostare la password.", cta: "Richiedi un nuovo link", href: "/forgot-password" },
  "recovery-device": { title: "Apri il link sul dispositivo corretto", text: "Apri il link nello stesso browser in cui hai richiesto il recupero, oppure richiedi un nuovo link da questo dispositivo.", cta: "Richiedi un nuovo link", href: "/forgot-password" },
  "recovery-supabase": { title: "Recupero non riuscito", text: "Si è verificato un problema temporaneo. Riprova dal link ricevuto oppure richiedine uno nuovo.", cta: "Richiedi un nuovo link", href: "/forgot-password" },
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const reason = (await searchParams).reason || "supabase";
  const content = messages[reason] || messages.supabase;
  return <main className="grid min-h-screen place-items-center px-4 py-10"><section className="card w-full max-w-md p-7 text-center sm:p-9"><div className="mb-7 flex justify-center"><Image src="/branding/logo.svg" alt="Armonia" width={140} height={129} priority className="h-auto w-32" /></div><h1 className="text-3xl font-bold">{content.title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{content.text}</p>{content.note&&<p className="mt-3 text-sm leading-6 text-slate-500">{content.note}</p>}<div className="mt-7 flex flex-col gap-3"><Link href={content.href||"/login"} className="btn btn-primary w-full">{content.cta || "Torna al login"}</Link>{!reason.startsWith("recovery-")&&reason!=="cross-device"&&<Link href="/signup" className="btn btn-secondary w-full">Crea un account</Link>}</div></section></main>;
}
