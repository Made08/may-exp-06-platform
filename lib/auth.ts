import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto";
import { cookies } from "next/headers";
import { pool } from "./db";

const COOKIE = "may_session";
const secret = () => process.env.AUTH_SECRET ?? "dev-only-NUNCA-en-produccion";

function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function createSessionToken(userId: string, days = 7) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + days * 864e5 })).toString("base64url");
  return payload + "." + sign(payload);
}

export interface Session { userId: string; orgId: string; role: string; email: string }

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  let p: { userId: string; exp: number };
  try { p = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
  if (!p?.userId || p.exp < Date.now()) return null;
  const r = await pool.query("SELECT id, organization_id, role, email FROM users WHERE id=$1", [p.userId]);
  const u = r.rows[0];
  if (!u) return null;
  return { userId: u.id, orgId: u.organization_id, role: u.role, email: u.email };
}

type Guard = { ok: true } | { ok: false; error: string; status: number };
export function requireRole(s: Session | null, roles: string[]): Guard {
  if (!s) return { ok: false, error: "No autenticado", status: 401 };
  if (!roles.includes(s.role)) return { ok: false, error: "Prohibido para el rol " + s.role, status: 403 };
  return { ok: true };
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(pw, salt, 64).toString("hex");
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  return timingSafeEqual(Buffer.from(key, "hex"), scryptSync(pw, salt, 64));
}
