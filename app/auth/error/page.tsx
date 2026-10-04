import Image from "next/image";
import Link from "next/link";

const messages: Record<string, { title: string; text: string }> = {
  expired: { title: "Link scaduto", text: "Il link di conferma non è più valido. Torna al login e richiedi un nuovo invio." },
  invalid: { title: "Link non valido", text: "Non è stato possibile verificare questo link. Potrebbe essere già stato usato oppure non essere completo." },
  incomplete: { title: "Conferma incompleta", text: "Il link non contiene le informazioni necessarie per completare la conferma." },
  supabase: { title: "Conferma non riuscita", text: "Si è verificato un problema temporaneo durante la verifica. Riprova dal link ricevuto oppure richiedine uno nuovo." },
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const reason = (await searchParams).reason || "supabase";
  const content = messages[reason] || messages.supabase;
  return <main className="grid min-h-screen place-items-center px-4 py-10"><section className="card w-full max-w-md p-7 text-center sm:p-9"><div className="mb-7 flex justify-center"><Image src="/branding/logo.svg" alt="Armonia" width={140} height={129} priority className="h-auto w-32" /></div><h1 className="text-3xl font-bold">{content.title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{content.text}</p><div className="mt-7 flex flex-col gap-3"><Link href="/login" className="btn btn-primary w-full">Torna al login</Link><Link href="/signup" className="btn btn-secondary w-full">Crea un account</Link></div></section></main>;
}
