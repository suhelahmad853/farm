import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { createToken, readToken, SESSION_COOKIE, SESSION_MAX_AGE, type SessionPayload } from "./auth";

export async function setSessionCookie(p: SessionPayload) {
  const token = await createToken(p);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Returns the logged-in super admin, or redirects to /login. */
export const requireAdmin = cache(async () => {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/login");
  const admin = await prisma.superAdmin.findUnique({ where: { id: s.id } });
  if (!admin || admin.tokenVersion !== s.tv) redirect("/login");
  return admin;
});

/** Returns the logged-in vendor's store, or redirects to /login (also when the store is inactive). */
export const requireVendor = cache(async () => {
  const s = await getSession();
  if (!s || s.role !== "VENDOR") redirect("/login");
  const store = await prisma.store.findUnique({ where: { id: s.id } });
  if (!store || store.tokenVersion !== s.tv) redirect("/login");
  if (!store.isActive) redirect("/login?reason=inactive");
  return store;
});
