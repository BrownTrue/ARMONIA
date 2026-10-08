export type AnchoredMenuRect = { top: number; right: number; bottom: number };
export type AnchoredMenuSize = { width: number; height: number };
export type MenuViewport = { width: number; height: number };

export function anchoredMenuPosition(anchor: AnchoredMenuRect, menu: AnchoredMenuSize, viewport: MenuViewport, gap = 6, padding = 8) {
  const width = Math.min(menu.width, Math.max(0, viewport.width - padding * 2));
  const height = Math.min(menu.height, Math.max(0, viewport.height - padding * 2));
  const left = Math.max(padding, Math.min(anchor.right - width, viewport.width - width - padding));
  const below = anchor.bottom + gap;
  const top = below + height <= viewport.height - padding
    ? below
    : Math.max(padding, Math.min(anchor.top - height - gap, viewport.height - height - padding));
  return { left, top, maxWidth: Math.max(0, viewport.width - padding * 2), maxHeight: Math.max(0, viewport.height - padding * 2), opensUp: top < below };
}
