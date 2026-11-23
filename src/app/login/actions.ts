"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import type { FormState } from "@/lib/types";

const INVALID = "Invalid mobile number or password";

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const mobile = String(fd.get("mobile") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!/^\d{10}$/.test(mobile) || !password) {
    return { error: "Enter your 10-digit mobile number and password" };
  }

  const admin = await prisma.superAdmin.findUnique({ where: { mobile } });
  if (admin) {
    if (!(await bcrypt.compare(password, admin.passwordHash))) return { error: INVALID };
    await setSessionCookie({ id: admin.id, role: "ADMIN", tv: admin.tokenVersion });
    redirect("/admin");
  }

  const store = await prisma.store.findUnique({ where: { mobile } });
  if (!store || !(await bcrypt.compare(password, store.passwordHash))) return { error: INVALID };
  if (!store.isActive) return { error: "Your store is deactivated. Please contact the admin." };

  await setSessionCookie({ id: store.id, role: "VENDOR", tv: store.tokenVersion });
  redirect("/vendor");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
