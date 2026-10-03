import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

/** Registro: requiere slug de organización existente. Rol inicial: DATA_CONTRIBUTOR.
 *  Los roles RESEARCH_ADMIN/RESEARCHER se asignan por un administrador desde la BD. */
export async function POST(req: Request) {
  const { email, password, orgSlug } = await req.json();
  if (!email || !password || password.length < 10 || !orgSlug)
    return NextResponse.json({ error: "email, password (≥10) y orgSlug requeridos" }, { status: 400 });
  const org = (await pool.query("SELECT id FROM organizations WHERE slug=$1", [orgSlug])).rows[0];
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  try {
    const r = await pool.query(
      "INSERT INTO users (organization_id, email, password_hash, role) VALUES ($1,$2,$3,'DATA_CONTRIBUTOR') RETURNING id",
      [org.id, String(email).toLowerCase(), hashPassword(password)]);
    return NextResponse.json({ userId: r.rows[0].id });
  } catch { return NextResponse.json({ error: "Email ya registrado" }, { status: 409 }); }
}
