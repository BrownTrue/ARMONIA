"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { anchoredMenuPosition } from "@/lib/anchored-menu";
import styles from "./anchored-action-menu.module.css";

type MenuAction = { label: string; onSelect: () => void; destructive?: boolean };

export function AnchoredActionMenu({ label, actions }: { label: string; actions: readonly MenuAction[] }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; maxWidth: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusedThisOpening = useRef(false);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const menu = menuRef.current?.getBoundingClientRect();
      if (!anchor || !menu) return;
      setPosition(anchoredMenuPosition(anchor, menu, { width: window.innerWidth, height: window.innerHeight }));
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      focusedThisOpening.current = false;
      setPosition(null);
      return;
    }
    // Position has been committed: the portal is now visible, before paint.
    // Do not steal focus again when scrolling or resizing repositions the menu.
    if (!position || focusedThisOpening.current) return;
    itemRefs.current[0]?.focus();
    focusedThisOpening.current = true;
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const closeFromOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const closeWhenFocusLeaves = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("focusin", closeWhenFocusLeaves);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("focusin", closeWhenFocusLeaves);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1 + actions.length) % actions.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + actions.length) % actions.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = actions.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    itemRefs.current[nextIndex]?.focus();
  };

  return <>
    <button ref={triggerRef} type="button" className={styles.trigger} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>⋯</button>
    {open && typeof document !== "undefined" && createPortal(<div ref={menuRef} id={id} className={styles.menu} role="menu" aria-label={label} onKeyDown={handleMenuKeyDown} style={position ? { left: position.left, top: position.top, maxWidth: position.maxWidth, maxHeight: position.maxHeight } : { left: 8, top: 8, visibility: "hidden" }}>
      {actions.map((action, index) => <button key={action.label} ref={(element) => { itemRefs.current[index] = element; }} type="button" role="menuitem" tabIndex={index === 0 ? 0 : -1} className={action.destructive ? styles.destructiveAction : undefined} onClick={() => { setOpen(false); action.onSelect(); }}>{action.label}</button>)}
    </div>, document.body)}
  </>;
}
