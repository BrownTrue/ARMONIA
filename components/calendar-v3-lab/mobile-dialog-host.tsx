"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Mobile controls share the existing editors, but their desktop parent is hidden.
// Only on phones, move the dialogs outside that display:none ancestor.
export function MobileCalendarDialogHost({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(viewport.matches);
    update();
    viewport.addEventListener("change", update);
    return () => viewport.removeEventListener("change", update);
  }, []);
  return mobile ? createPortal(children, document.body) : <>{children}</>;
}
