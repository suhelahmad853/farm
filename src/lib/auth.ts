// Edge-safe token helpers (used by middleware and server code). No DB access here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "ADMIN" | "VENDOR";
export type SessionPayload = { id: number; role: Role; tv: number };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set (min 32 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(p: SessionPayload) {
  return new SignJWT({ role: p.role, tv: p.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(p.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function readToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const role = payload.role;
    if (!Number.isInteger(id) || id <= 0) return null;
    if (role !== "ADMIN" && role !== "VENDOR") return null;
    return { id, role, tv: Number(payload.tv ?? 0) };
  } catch {
    return null;
  }
}
