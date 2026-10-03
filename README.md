# Plataforma experimental MAY-EXP-06 — Modelo Mayagüez de Adopción DevSecOps

Sistema científico experimental operacional para el experimento **MAY-EXP-06 (Gobernanza
adaptativa frente a CAB/gobernanza uniforme)**: consentimiento → captura → validación →
RAW → normalización → processing run versionado → métricas → estadística → hipótesis →
claims → evidencia → reporte → trazabilidad → reproducibilidad.

## 1. Objetivo
Operacionalizar el ciclo científico completo del experimento (no un dashboard demostrativo),
con aislamiento científico estricto respecto de los demás experimentos Mayagüez.

## 2. Arquitectura
Next.js 15 (App Router, TypeScript estricto) + Route Handlers + PostgreSQL 16 (Neon) +
sesión HMAC httpOnly + RBAC jerárquico. Núcleo científico aislado en
`lib/experiments/may-exp-06/`. Diagramas: `docs/architecture.mmd`, `docs/erd.mmd`.

## 3. Experimento
RQ06; hipótesis H1a–H1d; métricas primarias: ApprovalLeadTime, MIR, FTR, CFR,
ViolationRate, EvidenceCompleteness; no inferioridad δ_CFR=0.03, δ_Violation=0.02
(`preregistration.json` del testbed). Brazos: CAB_UNIFORM, POLICY_UNIFORM, MAYAGUEZ_ADAPTIVE.
Datos actuales: SYNTHETIC, siempre etiquetados.

## 4. Requisitos
Node 20+, PostgreSQL 16 (Neon recomendado), cuenta Vercel.

## 5. Variables de entorno
Copiar `.env.example` → `.env.local` y completar `DATABASE_URL`, `DIRECT_DATABASE_URL`,
`AUTH_SECRET` (`openssl rand -base64 32`), `EXPERIMENT_ID`, `EXPERIMENT_VERSION`,
`DATA_RETENTION_DAYS`, `MAX_UPLOAD_MB`, `APP_ENV`, `NEXT_PUBLIC_APP_NAME`.
Nunca commitear secretos.

## 6. Instalación
`npm install`

## 7. Creación de BD
`psql "$DIRECT_DATABASE_URL" -f database/schema.sql -f database/seeds.sql`
(DDL idempotente; semillas científicas de RQ, hipótesis, variables, métricas, criterios y claim C06).
Bootstrap de organización/usuario: manual, con hash scrypt fuera del repositorio.

## 8. Migraciones
El esquema es DDL idempotente versionado (`schema.sql` + `seeds.sql`, protocolo 1.0);
cambios de protocolo generan nuevas entradas en `experiment_versions`.

## 9. Ejecución local
`npm run dev` → http://localhost:3000

## 10. Tests
`npm test` — vectores de la batería ejecutada: Wilson(10/100)=[0.055229, 0.174366] (≈scipy),
Mann-Whitney exacto p≈0.0079, Newcombe simétrico, Risk(0.5 uniforme)=0.50, umbrales
0.20/−0.15, claim C06 bloqueado (NOT_EVALUABLE).

## 11. Despliegue Vercel
Importar el repositorio → variables por entorno (Development/Preview/Production) → deploy.
Endpoints server-side; sin secretos en el cliente.

## 12. Carga de datos
`/data`: registro manual (roles científicos y tooltips) o carga masiva CSV/XLSX/JSON con
mapeo de columnas, validación sin persistir, reporte de errores descargable y persistencia
del original (`dataset_files.raw_content` + SHA-256). Plantilla: `template.csv`.
Datos técnicos: `data/SYNTHETIC_TEST_DATA_MAY-EXP-06.csv` (300 filas, etiquetadas SYNTHETIC; para la batería completa de 9 000 registros, regenerar con `src/experiment.py` del testbed — ver `docs/VALIDATION_REPORT.md`).

## 13. Procesamiento
`/processing`: seleccionar datasets VALIDATED → ejecutar run versionado
(protocolo, esquema, algoritmo, semillas, configuración, hashes dataset/análisis).

## 14. Reporting
`/reports`: modo ÚLTIMO RUN o ACUMULADO (o `runIds[]` explícitos); secciones metadata,
periodo, RQ, hipótesis, claims, descriptivo, inferencial, criterios, amenazas,
limitaciones y reproducibilidad; export JSON/CSV/HTML imprimible a PDF; hashes
`dataset_hash`, `analysis_hash`, `report_hash` almacenados.

## 15. Seguridad
RBAC en todos los endpoints; sesión HMAC-signed (cookie httpOnly); validación server-side
Zod; límites de tamaño y MIME; auditoría sin secretos; aislamiento por organización;
sin secretos en código.

## 16. Privacidad
Privacy by Design: consentimiento registrado (usuario, organización, versión de política,
hash de IP opcional, aceptación), aislamiento multitenant, retención configurable
(`DATA_RETENTION_DAYS`), datos sintéticos siempre identificados.

## 17. Reproducibility
Cada run guarda versiones (protocolo/esquema/algoritmo), semillas, configuración,
`dataset_hash`, `analysis_hash` y un manifest (evidencia kind=MANIFEST) con
`manifest_hash` encadenado. El lineage claim → run → datasets → archivos → evidencia
se reconstruye en `/traceability` vía `/api/traceability/:claimId`.

## Validación ejecutada
Ver `docs/VALIDATION_REPORT.md` y `MAY-EXP-06_validation_results.json` — batería completa
(fidelidad de reproducción del testbed, vectores unitarios, estadística, run extremo a
extremo sobre 9 000 registros) con los parches ya integrados en este código.
