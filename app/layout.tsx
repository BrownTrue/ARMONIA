import "./globals.css";
import type { Metadata } from "next";
import {DataProvider} from "@/components/data-provider";
import {AuthGate} from "@/components/auth-gate";
// Supabase authentication is enforced for every application route.
export const metadata: Metadata={title:"Armonia | Gestione logopedica",description:"Gestionale personale per logopediste"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body><DataProvider><AuthGate>{children}</AuthGate></DataProvider></body></html>}
