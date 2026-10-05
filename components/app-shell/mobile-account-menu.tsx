import Link from "next/link";

export function MobileAccountMenu({ open, localMode, onNavigate, onLogout }: { open: boolean; localMode: boolean; onNavigate: () => void; onLogout: () => Promise<void> }) {
  if (!open) return null;
  return <div id="mobile-account-menu" className="mt-2 rounded-2xl border border-[#dfe6dc] bg-[#fcfcf8] p-1.5 shadow-[0_10px_24px_rgba(36,53,47,.06)]">
    <Link href="/impostazioni" onClick={onNavigate} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#3f5149] transition hover:bg-[#eef2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500">Impostazioni</Link>
    <button type="button" disabled={localMode} aria-describedby={localMode ? "mobile-local-signout-hint" : undefined} onClick={() => void onLogout()} className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-medium text-[#7c5d54] transition hover:bg-[#f5eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent">Logout</button>
    {localMode && <p id="mobile-local-signout-hint" className="px-3 pb-2 text-xs leading-5 text-[#77827c]">In modalità locale non c’è una sessione account da chiudere.</p>}
  </div>;
}
