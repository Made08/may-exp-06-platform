// Motor estadístico de la plataforma. Correcciones integradas de la batería de
// validación: (1) varianza de Mann-Whitney con factor n1·n2/12 en el término de empates;
// (2) ruta exacta para muestras pequeñas sin empates; (3) bootstrap determinista (mulberry32).
export function mean(a: number[]) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN; }

export function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y), n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function normalCdf(z: number) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
function erf(x: number) { // Abramowitz–Stegun 7.1.26 (|ε| ≤ 1.5e-7)
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

const Z95 = 1.959963984540054;

export function wilsonInterval(k: number, n: number): [number, number] {
  if (n === 0) return [NaN, NaN];
  const p = k / n, z2 = Z95 * Z95, d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d;
  const h = (Z95 / d) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return [c - h, c + h];
}

/** Newcombe (método 10) para diferencia de proporciones p1 − p2. */
export function newcombeInterval(k1: number, n1: number, k2: number, n2: number): [number, number] {
  const [l1, u1] = wilsonInterval(k1, n1), [l2, u2] = wilsonInterval(k2, n2);
  const p1 = k1 / n1, p2 = k2 / n2, d = p1 - p2;
  return [d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2), d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2)];
}

/** mulberry32 sin estado: u_k = f(k) — determinista y paralelizable. */
export function mulberry32Batch(seed0: number, count: number): number[] {
  const out: number[] = new Array(count);
  for (let k = 1; k <= count; k++) {
    const s = (seed0 + Math.imul(k, 0x6d2b79f5)) >>> 0;
    let t = s ^ (s >>> 15);
    t = Math.imul(t, s | 1);
    const u = t ^ (t >>> 7);
    const v = Math.imul(u, t | 61);
    const w = (((t + v) >>> 0) ^ t) >>> 0;
    out[k - 1] = ((w ^ (w >>> 14)) >>> 0) / 4294967296;
  }
  return out;
}

export function bootstrapMedianDiffCI(a: number[], b: number[], seed = 0, B = 2000): [number, number] {
  const na = a.length, nb = b.length;
  const uA = mulberry32Batch(seed, B * na), uB = mulberry32Batch(seed, B * nb);
  const diffs: number[] = [];
  for (let i = 0; i < B; i++) {
    const sa: number[] = [], sb: number[] = [];
    for (let j = 0; j < na; j++) sa.push(a[Math.floor(uA[i * na + j] * na)]);
    for (let j = 0; j < nb; j++) sb.push(b[Math.floor(uB[i * nb + j] * nb)]);
    diffs.push(median(sa) - median(sb));
  }
  diffs.sort((x, y) => x - y);
  return [diffs[Math.floor(0.025 * B)], diffs[Math.floor(0.975 * B)]];
}

export interface MWResult { U: number; p: number; method: "exact" | "normal-approx" }

function comb(n: number, k: number) { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; }

/** Mann-Whitney U: ruta exacta (n1,n2 ≤ 8 y sin empates); si no, normal con continuidad
 *  y varianza corregida por empates: Var(U) = (n1·n2/12)·[(N+1) − Σ(t³−t)/(N(N−1))]. */
export function mannWhitney(a: number[], b: number[]): MWResult {
  const n1 = a.length, n2 = b.length, N = n1 + n2;
  const all = [...a, ...b].map((v, i) => ({ v, g: i < n1 ? 0 : 1 }));
  all.sort((x, y) => x.v - y.v);
  const ranks = new Array<number>(N); let i = 0, tieSum = 0, hasTies = false;
  while (i < N) {
    let j = i;
    while (j < N && all[j].v === all[i].v) j++;
    const t = j - i;
    if (t > 1) { hasTies = true; tieSum += t ** 3 - t; }
    for (let k = i; k < j; k++) ranks[k] = (i + j + 1) / 2;
    i = j;
  }
  const R1 = ranks.reduce((s, r, k) => s + (all[k].g === 0 ? r : 0), 0);
  const U = R1 - (n1 * (n1 + 1)) / 2;
  if (!hasTies && n1 <= 8 && n2 <= 8) {
    const maxR = (n1 * (N + n2 + 1)) / 2 + n1 * n2; // cota segura
    const dp: Float64Array[] = [];
    for (let j = 0; j <= n1; j++) dp.push(new Float64Array(maxR + 1));
    dp[0][0] = 1;
    for (let item = 1; item <= N; item++)
      for (let j = Math.min(n1, item); j >= 0; j--)
        for (let r = maxR; r >= item; r--)
          if (dp[j - 1][r - item]) dp[j][r] += dp[j - 1][r - item];
    let cum = 0; const R = Math.round(R1);
    for (let r = 0; r <= R; r++) cum += dp[n1][r];
    const total = comb(N, n1);
    const p = Math.min(1, (2 * Math.min(cum, total - cum)) / total);
    return { U, p, method: "exact" };
  }
  const mu = (n1 * n2) / 2;
  const varU = ((n1 * n2) / 12) * (N + 1 - tieSum / (N * (N - 1)));
  const z = varU > 0 ? (Math.abs(U - mu) - 0.5) / Math.sqrt(varU) : 0;
  return { U, p: 2 * (1 - normalCdf(Math.abs(z))), method: "normal-approx" };
}
