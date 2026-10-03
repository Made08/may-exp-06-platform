import "./globals.css";
import Link from "next/link";

const NAV = [
  ["/experiment", "Experimento"], ["/data", "Datos"], ["/processing", "Procesamiento"],
  ["/dashboard", "Dashboard"], ["/reports", "Reportes"], ["/traceability", "Trazabilidad"], ["/privacy", "Privacidad"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <header className="border-b border-zinc-800 p-4 flex flex-wrap gap-4 items-center">
          <Link href="/" className="font-bold text-sky-400">MAY-EXP-06 · Mayagüez</Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {NAV.map(([href, label]) => <Link key={href} href={href} className="hover:text-sky-400">{label}</Link>)}
          </nav>
        </header>
        <main className="p-6 max-w-6xl mx-auto">{children}</main>
        <footer className="p-4 text-xs text-zinc-500 border-t border-zinc-800">
          Plataforma experimental del Modelo Mayagüez — datos SYNTHETIC; aislamiento científico por experimento.
        </footer>
      </body>
    </html>
  );
}
