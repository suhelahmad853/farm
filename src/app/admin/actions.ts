"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, setSessionCookie } from "@/lib/session";
import type { FormState } from "@/lib/types";
import { firstError, formObject, mobileSchema, optionalText, passwordSchema } from "@/lib/validate";

const storeBase = z.object({
  storeName: z.string().min(2, "Store name is required").max(100),
  ownerName: z.string().min(2, "Owner name is required").max(100),
  mobile: mobileSchema,
  address: optionalText(255),
});

async function mobileTaken(mobile: string, exceptStoreId?: number) {
  const [admin, store] = await Promise.all([
    prisma.superAdmin.findUnique({ where: { mobile } }),
    prisma.store.findUnique({ where: { mobile } }),
  ]);
  return !!admin || (!!store && store.id !== exceptStoreId);
}

export async function createStore(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = storeBase.extend({ password: passwordSchema }).safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  if (await mobileTaken(d.mobile)) return { error: "This mobile number is already registered" };

  await prisma.store.create({
    data: {
      storeName: d.storeName,
      ownerName: d.ownerName,
      mobile: d.mobile,
      address: d.address,
      passwordHash: await bcrypt.hash(d.password, 10),
    },
  });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateStore(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = storeBase
    .extend({ password: z.union([z.literal(""), passwordSchema]).optional() })
    .safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) return { error: "Store not found" };
  if (await mobileTaken(d.mobile, id)) return { error: "This mobile number is already registered" };

  await prisma.store.update({
    where: { id },
    data: {
      storeName: d.storeName,
      ownerName: d.ownerName,
      mobile: d.mobile,
      address: d.address,
      // A new password logs the vendor out of all devices.
      ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10), tokenVersion: { increment: 1 } } : {}),
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/stores/${id}`);
  return { success: d.password ? "Store updated and password reset" : "Store updated" };
}

export async function toggleStore(id: number, _prev: FormState): Promise<FormState> {
  await requireAdmin();
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) return { error: "Store not found" };
  await prisma.store.update({ where: { id }, data: { isActive: !store.isActive } });
  revalidatePath("/admin");
  revalidatePath(`/admin/stores/${id}`);
  return {};
}

export async function changeAdminPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const o = formObject(fd);
  const parsed = passwordSchema.safeParse(fd.get("newPassword"));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (o.newPassword !== o.confirmPassword) return { error: "New passwords do not match" };
  if (!(await bcrypt.compare(String(fd.get("currentPassword") ?? ""), admin.passwordHash))) {
    return { error: "Current password is incorrect" };
  }
  const updated = await prisma.superAdmin.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(parsed.data, 10), tokenVersion: { increment: 1 } },
  });
  await setSessionCookie({ id: admin.id, role: "ADMIN", tv: updated.tokenVersion });
  return { success: "Password changed" };
}
