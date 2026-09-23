import Image from "next/image";
import Link from "next/link";

export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <header className="border-b border-sage-100 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/about" className="flex items-center gap-3 text-lg font-bold">
            <Image
              src="/branding/logo-mark.svg"
              alt=""
              width={31}
              height={36}
              priority
              className="h-9 w-auto"
            />
            Armonia
          </Link>
          <nav aria-label="Pagine pubbliche" className="flex items-center gap-4 text-sm font-bold text-sage-700">
            <Link href="/about" className="hover:underline">Informazioni</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/login" className="btn btn-quiet">Accedi</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}
