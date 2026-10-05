"use client";

import { usePathname, useRouter } from "next/navigation";
import { DesktopShellChrome } from "./app-shell/desktop-shell-chrome";
import { MobileShellChrome } from "./app-shell/mobile-shell-chrome";
import { useData } from "./data-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(), router = useRouter();
  const { data, connection, signOut } = useData();
  const profileName = `${data.profile.firstName} ${data.profile.lastName}`.trim() || "Profilo Armonia";
  const initials = `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`.toUpperCase() || "A";
  return <div className="min-h-screen md:flex">
    <DesktopShellChrome pathname={pathname} profile={data.profile}/>
    <MobileShellChrome pathname={pathname} profile={{ name: profileName, profession: data.profile.profession, initials }} localMode={connection.kind === "local"} onLogout={async () => { await signOut(); router.replace("/login"); }}/>
    <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 pb-10 pt-6 sm:px-8 md:pt-10">{children}</main>
  </div>;
}
