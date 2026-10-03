# Batería de validación ejecutada — MAY-EXP-06 (resumen)

Fuente de datos: dataset de 9 000 registros (5 semillas × 2 réplicas × 3 brazos × 300), regenerado desde `src/experiment.py`. El CSV `data/SYNTHETIC_TEST_DATA_MAY-EXP-06.csv` incluido (300 filas) sirve para pruebas técnicas de carga/ingesta. con fidelidad ≤ 9.2e-17 frente a `ground_truth.csv`. Resultados completos: `MAY-EXP-06_validation_results.json`.

## 1. Fidelidad de reproducción
- risk/trust/AI vs `ground_truth.csv`: max |Δ| ≤ 9.2e-17 (épsilon de máquina).
- ΔCFR bloques = −0.002000 y ΔViol = −0.005333: idénticos al histórico del testbed.

## 2. Vectores unitarios
- Risk(uniforme 0.5) = 0.50 (vector 0.58 anterior era erróneo → test corregido).
- Trust extremos 1/0 exactos; umbrales: 0.20→FAST_TRACK, 0.1999→AUTOMATED_GATES, −0.15→AUTOMATED_GATES, −0.1501→HUMAN_REVIEW.

## 3. Estadística
- Wilson(10/100)=[0.055229, 0.174366] — idéntico a scipy.
- Mann-Whitney exacto [1..5] vs [10..14]: p=0.0079 (la aproximación normal daba 0.0122; se añadió ruta exacta y se corrigió la varianza por empates: factor n1·n2/12).
- Bootstrap determinista (mulberry32 sin estado).

## 4. Run extremo a extremo (9 000 registros)
| Métrica | CAB | POLICY | MAYAGUEZ |
|---|---|---|---|
| ALT mediana (min) | 849.6 | 14.0 | 15.0 |
| MIR | 1.0000 | 0.0510 | 0.0010 |
| FTR | 0.0000 | 0.0000 | 0.6110 |
| CFR | 0.0490 | 0.0540 | 0.0520 |
| ViolationRate | 0.0330 | 0.0403 | 0.0350 |
| EC | 0.8398 | 0.9091 | 0.9443 |

Inferencial: Mann-Whitney U=0, p<1e-16; ALTR=0.9823; IC95 bootstrap Δmediana=[−847.9, −820.3] min; ΔMIR=−0.9990 IC=[−0.9997, −0.9967]; NI: CI95sup(ΔCFR)=+0.0094<0.03 ✓, CI95sup(ΔViol)=+0.0043<0.02 ✓.

## 5. Evaluación científica
- H1a/H1b: NOT_EVALUABLE (práctico PENDIENTE_DE_DEFINICION; estadístico y robustez 5/5 PASS).
- H1c/H1d: NOT_EVALUABLE (estadístico y margen PASS; robustez sin regla definida para binarias — shares exploratorios 3/5).
- C06: NOT_EVALUABLE — comportamiento de bloqueo correcto.

## 6. Parches integrados en esta versión
1. Vector de Risk del test (0.50).
2. Varianza de Mann-Whitney con empates + ruta exacta para n≤8.
3. Criterio estadístico de H1b por IC de Newcombe (antes usaba p-valor inexistente).
4. Unicidad por clave compuesta (unit_id, arm, seed, replication) en DataQuality.
5. Robustez multisemilla real con regla aplicable solo a ALT/MIR (CFR/Violation → NOT_EVALUABLE).
6. Reports acumulativo corregido (consulta por organización + soporte runIds[]).
7. Manifest de reproducibilidad por run (evidencia kind=MANIFEST encadenada).
