import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./premium-action.module.css";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode };

export function PremiumAction({ href, className = "", children, ...props }: Props) {
  return <Link href={href} {...props} className={`${styles.action} ${className}`}><span className={styles.label}>{children}</span><span className={styles.icon} aria-hidden="true">↗</span></Link>;
}
