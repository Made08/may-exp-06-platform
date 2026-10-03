import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const POLICY_VERSION = "1.0";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { accepted } = await req.json();
  if (typeof accepted !== "boolean") return NextResponse.json({ error: "accepted debe ser booleano" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for") ?? "";
  const ipHash = ip ? createHash("sha256").update(ip + process.env.AUTH_SECRET).digest("hex") : null;
  const r = await pool.query(
    "INSERT INTO consents (organization_id, user_id, policy_version, accepted, ip_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [s.orgId, s.userId, POLICY_VERSION, accepted, ipHash]);
  await pool.query("INSERT INTO audit_logs (organization_id, user_id, event, metadata) VALUES ($1,$2,$3,$4)",
    [s.orgId, s.userId, "CONSENT_ACCEPTED", JSON.stringify({ accepted, policy_version: POLICY_VERSION })]);
  return NextResponse.json({ consentId: r.rows[0].id, accepted });
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const r = await pool.query("SELECT policy_version, accepted, created_at FROM consents WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1", [s.userId]);
  return NextResponse.json({ latest: r.rows[0] ?? null, policyVersion: POLICY_VERSION });
}
