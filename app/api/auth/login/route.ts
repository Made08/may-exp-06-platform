import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const u = (await pool.query("SELECT id, password_hash FROM users WHERE email=$1", [String(email ?? "").toLowerCase()])).rows[0];
  if (!u || !verifyPassword(String(password ?? ""), u.password_hash))
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  const token = createSessionToken(u.id);
  const { cookies } = await import("next/headers");
  (await cookies()).set("may_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.APP_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return NextResponse.json({ ok: true });
}
