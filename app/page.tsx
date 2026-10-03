import Link from "next/link";

export default function Home() {
  const items = [
    ["/experiment", "Experimento", "Diseño científico, modelo matemático y criterios de aceptación"],
    ["/data", "Datos", "Captura manual y carga masiva con validación y calidad"],
    ["/processing", "Procesamiento", "Runs versionados con hashes dataset/análisis"],
    ["/dashboard", "Dashboard", "Resultados desde la base de datos (nunca ficticios)"],
    ["/reports", "Reportes", "Último run o acumulado; JSON/CSV/HTML-PDF"],
    ["/traceability", "Trazabilidad", "Lineage claim → run → datasets → evidencia"],
    ["/privacy", "Privacidad", "Consentimiento y protección de datos"],
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {items.map(([href, t, d]) => (
        <Link key={href} href={href} className="border border-zinc-800 rounded p-4 hover:border-sky-600">
          <div className="font-semibold text-sky-400">{t}</div><div className="text-sm text-zinc-400">{d}</div>
        </Link>
      ))}
    </div>
  );
}
