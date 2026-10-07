"use client";

import Link from "next/link";
import type { PointerEvent, ReactNode } from "react";
import styles from "./spotlight-card.module.css";

export function SpotlightCard({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  };

  return <Link href={href} onPointerMove={handlePointerMove} onPointerLeave={(event) => { event.currentTarget.style.removeProperty("--spot-x"); event.currentTarget.style.removeProperty("--spot-y"); }} className={`${styles.card} ${className}`}>
    <span className={styles.spotlight} aria-hidden="true"/>
    <span className={styles.content}>{children}</span>
  </Link>;
}
