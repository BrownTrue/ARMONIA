"use client";

import { usePathname, useRouter } from "next/navigation";
import { DesktopShellChrome } from "./app-shell/desktop-shell-chrome";
import { MobileShellChrome } from "./app-shell/mobile-shell-chrome";
import { desktopEditorialSection } from "./app-shell/desktop-editorial-model";
import editorialStyles from "./app-shell/desktop-editorial-shell.module.css";
import { useData } from "./data-provider";

export type MobileHeaderDetail = { variant: "detail"; title: string; backHref: string; backLabel?: string; onBack?: () => void };

export function AppShell({ children, mobileHeader, mobileFullScreen = false, desktopFullScreen = false, desktopWide = false }: { children: React.ReactNode; mobileHeader?: MobileHeaderDetail; mobileFullScreen?: boolean; desktopFullScreen?: boolean; desktopWide?: boolean }) {
  const pathname = usePathname(), router = useRouter();
  const { data, connection, signOut } = useData();
  const profileName = `${data.profile.firstName} ${data.profile.lastName}`.trim() || "Profilo Armonia";
  const initials = `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`.toUpperCase() || "A";
  const editorialSection = desktopEditorialSection(pathname, desktopFullScreen);
  return <div className={`organic-editorial-shell min-h-screen min-h-[100dvh] md:flex ${desktopFullScreen ? "md:h-dvh md:min-h-0 md:overflow-hidden" : ""}`}>
    <DesktopShellChrome pathname={pathname} profile={data.profile} localMode={connection.kind === "local"} onLogout={async () => { await signOut(); router.replace("/login"); }}/>
    <MobileShellChrome pathname={pathname} detailHeader={mobileHeader} profile={{ name: profileName, profession: data.profile.profession, initials }} localMode={connection.kind === "local"} onLogout={async () => { await signOut(); router.replace("/login"); }}/>
    <div className={`${editorialStyles.workspace} ${desktopFullScreen ? editorialStyles.workspaceFullscreen : ""}`}>
      {editorialSection && <header className={editorialStyles.toolbar}>
        <div className={editorialStyles.toolbarInner}>
          <span className={editorialStyles.brand}>ARMONIA</span>
          <span className={editorialStyles.divider} aria-hidden="true">/</span>
          <span className={`${editorialStyles.workspaceLabel} organic-editorial-title`}>{editorialSection}</span>
        </div>
      </header>}
      <main className={`mx-auto min-w-0 max-w-6xl flex-1 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-8 md:pb-10 md:pt-10 ${mobileFullScreen ? "px-0 pt-0" : "px-4 pt-6 sm:px-8"} ${desktopFullScreen ? "md:h-dvh md:min-h-0 md:max-w-none md:overflow-hidden md:px-0 md:pb-0 md:pt-0" : ""} ${desktopWide ? editorialStyles.wideMain : ""}`}>{children}</main>
    </div>
  </div>;
}
