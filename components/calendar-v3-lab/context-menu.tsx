"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  clampContextMenuPosition,
  nextContextMenuIndex,
  type CalendarContextMenuAction,
  type CalendarContextMenuItem,
} from "@/lib/calendar-v3-lab/context-menu";
import styles from "./calendar-v3-lab.module.css";

type ContextMenuProps = {
  anchorPoint: { x: number; y: number };
  items: readonly CalendarContextMenuItem[];
  origin: HTMLElement;
  scrollElement: HTMLElement | null;
  header?: React.ReactNode;
  onAction: (action: CalendarContextMenuAction) => void;
  onClose: () => void;
};

export function ContextMenu({ anchorPoint, items, origin, scrollElement, header, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [position, setPosition] = useState(anchorPoint);
  const activeIndexRef = useRef(0);

  useLayoutEffect(() => {
    const rectangle = menuRef.current?.getBoundingClientRect();
    if (!rectangle) return;
    setPosition(clampContextMenuPosition(
      anchorPoint,
      { width: rectangle.width, height: rectangle.height },
      { width: window.innerWidth, height: window.innerHeight },
    ));
    itemRefs.current[0]?.focus();
  }, [anchorPoint]);

  useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const closeFromResize = () => onClose();
    const initialScrollTop = scrollElement?.scrollTop ?? 0;
    const closeFromScroll = () => {
      if (scrollElement && Math.abs(scrollElement.scrollTop - initialScrollTop) >= 8) onClose();
    };
    document.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("resize", closeFromResize);
    scrollElement?.addEventListener("scroll", closeFromScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("resize", closeFromResize);
      scrollElement?.removeEventListener("scroll", closeFromScroll);
    };
  }, [onClose, scrollElement]);

  const moveFocus = (key: "ArrowDown" | "ArrowUp" | "Home" | "End") => {
    const nextIndex = nextContextMenuIndex(activeIndexRef.current, items.length, key);
    activeIndexRef.current = nextIndex;
    itemRefs.current[nextIndex]?.focus();
  };

  return <div
    ref={menuRef}
    className={styles.contextMenu}
    role="menu"
    aria-label={header ? "Azioni appuntamento" : "Azioni calendario"}
    style={{ left: position.x, top: position.y }}
    onContextMenu={(event) => event.preventDefault()}
    onKeyDown={(event) => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        moveFocus(event.key as "ArrowDown" | "ArrowUp" | "Home" | "End");
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        origin.focus();
      }
    }}
  >
    {header ? <>
      <div className={styles.contextMenuHeader}>{header}</div>
      <div className={styles.contextMenuSeparator} role="separator" />
    </> : null}
    {items.map((item, index) => <div key={item.id} role="none">
      {item.separatorBefore ? <div className={styles.contextMenuSeparator} role="separator" /> : null}
      <button
        ref={(element) => { itemRefs.current[index] = element; }}
        type="button"
        role="menuitem"
        tabIndex={index === 0 ? 0 : -1}
        className={item.destructive ? styles.contextMenuDestructive : undefined}
        onFocus={() => { activeIndexRef.current = index; }}
        onClick={() => onAction(item.id)}
      >{item.label}</button>
    </div>)}
  </div>;
}
