"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { NavigationIconName } from "./navigation-model";
import { NavigationIcon } from "./navigation-icons";
import { desktopNavigationItems, isNavigationItemActive } from "./navigation-model";
import styles from "./desktop-shell-chrome.module.css";

type Profile = { firstName: string; lastName: string; profession: string };

export function DesktopShellChrome({ pathname, profile, localMode, onLogout }: { pathname: string; profile: Profile; localMode: boolean; onLogout: () => Promise<void> }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const profileName = `${profile.firstName} ${profile.lastName}`.trim() || "Profilo Armonia";
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || "A";

  useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [accountOpen]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && accountOpen) {
      setAccountOpen(false);
      accountButtonRef.current?.focus();
    }
  };

  return <aside className={styles.dock} aria-label="Navigazione ARMONIA" onKeyDown={handleKeyDown}>
    <Link href="/oggi" className={styles.brand} aria-label="ARMONIA, vai a Oggi">
      <Image src="/branding/logo-mark.svg" alt="" width={31} height={36} priority />
    </Link>
    <nav className={styles.primaryNavigation} aria-label="Navigazione principale">
      {desktopNavigationItems.filter((item) => item.href !== "/impostazioni").map((item) => {
        const active = isNavigationItemActive(pathname, item.href);
        return <DockNavigationLink key={item.href} href={item.href} label={item.label} active={active} icon={item.mobileIcon}/>;
      })}
    </nav>
    <div className={styles.bottomArea}>
      <DockNavigationLink href="/impostazioni" label="Impostazioni" active={isNavigationItemActive(pathname, "/impostazioni")} icon="settings"/>
      <div className={styles.accountArea} ref={accountRef}>
        {accountOpen && <div className={styles.accountMenu} id="desktop-account-menu" role="group" aria-label="Menu account">
          <div className={styles.accountIdentity}><span>{profileName}</span><small>{profile.profession || "Profilo ARMONIA"}</small></div>
          <Link href="/impostazioni" onClick={() => setAccountOpen(false)}>Impostazioni account</Link>
          <button type="button" disabled={localMode} aria-describedby={localMode ? "desktop-local-logout-hint" : undefined} onClick={() => void onLogout()}>Logout</button>
          {localMode && <small id="desktop-local-logout-hint" className={styles.localHint}>In modalità locale non c’è una sessione account da chiudere.</small>}
        </div>}
        <button ref={accountButtonRef} type="button" className={styles.accountButton} aria-label={`Account ${profileName}`} aria-expanded={accountOpen} aria-controls={accountOpen ? "desktop-account-menu" : undefined} onClick={() => setAccountOpen((open) => !open)}>
          <span className={styles.avatar}>{initials}</span>
        </button>
      </div>
    </div>
  </aside>;
}

function DockNavigationLink({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: NavigationIconName }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const getTooltipAnchor = () => linkRef.current?.querySelector("svg")?.getBoundingClientRect() ?? linkRef.current?.getBoundingClientRect() ?? null;
  useEffect(() => {
    if (!hovered && !focused) {
      setAnchor(null);
      return;
    }
    const update = () => setAnchor(getTooltipAnchor());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [hovered, focused]);

  return <>
    <Link ref={linkRef} href={href} className={`${styles.navLink} ${active ? styles.active : ""}`} aria-label={label} aria-current={active ? "page" : undefined} aria-describedby={anchor ? `${idFor(label)}-tooltip` : undefined} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <NavigationIcon name={icon} className={styles.icon}/>
    </Link>
    {anchor && typeof document !== "undefined" && createPortal(<span id={`${idFor(label)}-tooltip`} className={styles.tooltip} role="tooltip" style={{ left: anchor.right + 12, top: anchor.top + anchor.height / 2 }}>{label}</span>, document.body)}
  </>;
}

function idFor(label: string) {
  return `desktop-dock-${label.toLocaleLowerCase("it-IT").replace(/[^a-z0-9]+/g, "-")}`;
}
