"use client";

import { usePathname, useRouter } from "next/navigation";
import { DesktopShellChrome } from "./app-shell/desktop-shell-chrome";
import { MobileShellChrome } from "./app-shell/mobile-shell-chrome";
import { useData } from "./data-provider";

export type MobileHeaderDetail = { variant: "detail"; title: string; backHref: string; backLabel?: string; onBack?: () => void };

export function AppShell({ children, mobileHeader, mobileFullScreen = false }: { children: React.ReactNode; mobileHeader?: MobileHeaderDetail; mobileFullScreen?: boolean }) {
  const pathname = usePathname(), router = useRouter();
  const { data, connection, signOut } = useData();
  const profileName = `${data.profile.firstName} ${data.profile.lastName}`.trim() || "Profilo Armonia";
  const initials = `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`.toUpperCase() || "A";
  return <div className="min-h-screen min-h-[100dvh] md:flex">
    <DesktopShellChrome pathname={pathname} profile={data.profile}/>
    <MobileShellChrome pathname={pathname} detailHeader={mobileHeader} profile={{ name: profileName, profession: data.profile.profession, initials }} localMode={connection.kind === "local"} onLogout={async () => { await signOut(); router.replace("/login"); }}/>
    <main className={`mx-auto min-w-0 max-w-6xl flex-1 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-8 md:pb-10 md:pt-10 ${mobileFullScreen ? "px-0 pt-0" : "px-4 pt-6 sm:px-8"}`}>{children}</main>
  </div>;
}
