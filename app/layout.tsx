import "./globals.css";
import type { Metadata, Viewport } from "next";
import {DataProvider} from "@/components/data-provider";
import {AuthGate} from "@/components/auth-gate";
import {BrandingProvider} from "@/components/branding-provider";
// Supabase authentication is enforced for private application routes.
export const metadata: Metadata={title:"Armonia | Gestione logopedica",description:"Gestionale personale per logopediste",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"Armonia",statusBarStyle:"default"},icons:{icon:[{url:"/branding/favicon.ico",type:"image/x-icon"},{url:"/branding/icon-192.png",type:"image/png",sizes:"192x192"},{url:"/branding/icon-512.png",type:"image/png",sizes:"512x512"}],shortcut:"/branding/favicon.ico",apple:[{url:"/branding/icon-512.png",sizes:"512x512",type:"image/png"}]}};
export const viewport: Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#46654c"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body><DataProvider><BrandingProvider><AuthGate>{children}</AuthGate></BrandingProvider></DataProvider></body></html>}
