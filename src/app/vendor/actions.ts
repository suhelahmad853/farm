"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVendor, setSessionCookie } from "@/lib/session";
import { getCustomerPending, getStock } from "@/lib/data";
import { CATEGORIES, inr, num, PAYMENT_MODES, round2, SIZE_LABEL, SIZES, toDbDate } from "@/lib/format";
import type { FormState } from "@/lib/types";
import {
  dateSchema,
  firstError,
  formObject,
  mobileSchema,
  optionalText,
  passwordSchema,
  positiveNumber,
} from "@/lib/validate";

function refresh(...paths: string[]) {
  for (const p of ["/vendor", ...paths]) revalidatePath(p);
}

/* ---------------- Purchase ---------------- */

const purchaseSchema = z.object({
  date: dateSchema,
  size: z.enum(SIZES, { message: "Select a size" }),
  pieces: z.coerce.number().int("Pieces must be a whole number").positive("Pieces must be greater than 0").max(10_000_000),
  weightKg: positiveNumber("Weight"),
  ratePerKg: positiveNumber("Rate"),
  supplierName: optionalText(100),
  note: optionalText(255),
});

export async function addPurchase(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const parsed = purchaseSchema.safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const total = round2(d.weightKg * d.ratePerKg);

  await prisma.purchase.create({
    data: { ...d, storeId: store.id, date: toDbDate(d.date), totalAmount: total },
  });
  refresh("/vendor/purchases");
  return { success: `Purchase saved: ${d.pieces} pcs ${SIZE_LABEL[d.size]}, ${inr(total)}` };
}

export async function deletePurchase(id: number, _prev: FormState): Promise<FormState> {
  const store = await requireVendor();
  const purchase = await prisma.purchase.findFirst({ where: { id, storeId: store.id } });
  if (!purchase) return { error: "Entry not found" };
  const stock = (await getStock(store.id)).find((s) => s.size === purchase.size)!;
  if (stock.pieces - purchase.pieces < 0) {
    return { error: "Cannot delete: these pieces are already sold. Delete the related sales first." };
  }
  await prisma.purchase.delete({ where: { id } });
  refresh("/vendor/purchases");
  return {};
}

/* ---------------- Expense ---------------- */

const expenseSchema = z.object({
  date: dateSchema,
  category: z.enum(CATEGORIES, { message: "Select a category" }),
  amount: positiveNumber("Amount"),
  description: optionalText(255),
});

export async function addExpense(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const parsed = expenseSchema.safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  if ((d.category === "OTHER" || d.category === "LABOUR") && !d.description) {
    return { error: "Please add a description for this expense" };
  }
  await prisma.expense.create({
    data: { ...d, amount: round2(d.amount), storeId: store.id, date: toDbDate(d.date) },
  });
  refresh("/vendor/expenses");
  return { success: `Expense saved: ${inr(round2(d.amount))}` };
}

export async function deleteExpense(id: number, _prev: FormState): Promise<FormState> {
  const store = await requireVendor();
  const res = await prisma.expense.deleteMany({ where: { id, storeId: store.id } });
  if (!res.count) return { error: "Entry not found" };
  refresh("/vendor/expenses");
  return {};
}

/* ---------------- Customer ---------------- */

const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required").max(100),
  mobile: z.union([z.literal(""), mobileSchema]).optional().transform((v) => v || null),
  address: optionalText(255),
  defaultSize: z.union([z.literal(""), z.enum(SIZES)]).optional().transform((v) => v || null),
  defaultRate: z
    .union([z.literal(""), positiveNumber("Default rate")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : round2(v))),
});

async function customerMobileTaken(storeId: number, mobile: string | null, exceptId?: number) {
  if (!mobile) return false;
  const c = await prisma.customer.findFirst({ where: { storeId, mobile } });
  return !!c && c.id !== exceptId;
}

export async function addCustomer(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const parsed = customerSchema.safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  if (await customerMobileTaken(store.id, d.mobile)) return { error: "A customer with this mobile number already exists" };
  await prisma.customer.create({ data: { ...d, storeId: store.id } });
  refresh("/vendor/customers", "/vendor/sales");
  return { success: `Customer ${d.name} added` };
}

export async function updateCustomer(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const parsed = customerSchema.safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const existing = await prisma.customer.findFirst({ where: { id, storeId: store.id } });
  if (!existing) return { error: "Customer not found" };
  if (await customerMobileTaken(store.id, d.mobile, id)) return { error: "A customer with this mobile number already exists" };
  await prisma.customer.update({ where: { id }, data: d });
  refresh("/vendor/customers", `/vendor/customers/${id}`, "/vendor/sales");
  return { success: "Customer updated" };
}

export async function deleteCustomer(id: number, _prev: FormState): Promise<FormState> {
  const store = await requireVendor();
  const c = await prisma.customer.findFirst({
    where: { id, storeId: store.id },
    include: { _count: { select: { sales: true, payments: true } } },
  });
  if (!c) return { error: "Customer not found" };
  if (c._count.sales || c._count.payments) {
    return { error: "Cannot delete: this customer has sales or payments" };
  }
  await prisma.customer.delete({ where: { id } });
  refresh("/vendor/customers", "/vendor/sales");
  redirect("/vendor/customers");
}

/* ---------------- Sale ---------------- */

const saleSchema = z.object({
  date: dateSchema,
  customerId: z.string().optional(),
  customerName: optionalText(100),
  size: z.enum(SIZES, { message: "Select a size" }),
  pieces: z.coerce.number().int("Pieces must be a whole number").positive("Pieces must be greater than 0").max(10_000_000),
  weightKg: positiveNumber("Weight"),
  ratePerKg: positiveNumber("Rate"),
  paidAmount: z.coerce.number({ message: "Paid amount must be a number" }).min(0, "Paid amount cannot be negative"),
  paymentMode: z.enum(PAYMENT_MODES, { message: "Select payment mode" }),
  note: optionalText(255),
});

export async function addSale(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const parsed = saleSchema.safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const total = round2(d.weightKg * d.ratePerKg);
  const paid = round2(d.paidAmount);

  let customerId: number | null = null;
  let customerName: string;
  if (d.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: Number(d.customerId), storeId: store.id } });
    if (!customer) return { error: "Select a valid customer" };
    customerId = customer.id;
    customerName = customer.name;
  } else {
    customerName = d.customerName || "Walk-in customer";
  }

  if (paid > total) return { error: `Paid amount cannot be more than the total (${inr(total)})` };
  if (!customerId && paid !== total) {
    return { error: "Walk-in sales must be fully paid. Add the customer to keep a pending amount." };
  }

  const stock = (await getStock(store.id)).find((s) => s.size === d.size)!;
  if (d.pieces > stock.pieces) {
    return { error: `Not enough ${SIZE_LABEL[d.size]} stock. Available: ${stock.pieces} pcs` };
  }

  await prisma.sale.create({
    data: {
      storeId: store.id,
      customerId,
      customerName,
      date: toDbDate(d.date),
      size: d.size,
      pieces: d.pieces,
      weightKg: d.weightKg,
      ratePerKg: d.ratePerKg,
      totalAmount: total,
      paidAmount: paid,
      paymentMode: d.paymentMode,
      note: d.note,
    },
  });
  refresh("/vendor/sales", "/vendor/customers", ...(customerId ? [`/vendor/customers/${customerId}`] : []));
  const pending = round2(total - paid);
  return { success: `Sale saved: ${inr(total)}${pending > 0 ? ` (${inr(pending)} added to pending)` : ""}` };
}

export async function deleteSale(id: number, _prev: FormState): Promise<FormState> {
  const store = await requireVendor();
  const sale = await prisma.sale.findFirst({ where: { id, storeId: store.id } });
  if (!sale) return { error: "Entry not found" };
  if (sale.customerId) {
    const pending = await getCustomerPending(store.id, sale.customerId);
    const salePending = num(sale.totalAmount) - num(sale.paidAmount);
    if (round2(pending - salePending) < 0) {
      return { error: "Cannot delete: payments were already received against this sale. Delete those payments first." };
    }
  }
  await prisma.sale.delete({ where: { id } });
  refresh("/vendor/sales", "/vendor/customers", ...(sale.customerId ? [`/vendor/customers/${sale.customerId}`] : []));
  return {};
}

/* ---------------- Customer payment (KhataBook) ---------------- */

const paymentSchema = z.object({
  date: dateSchema,
  amount: positiveNumber("Amount"),
  paymentMode: z.enum(PAYMENT_MODES, { message: "Select payment mode" }),
  note: optionalText(255),
});

export async function addPayment(customerId: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const parsed = paymentSchema.safeParse(formObject(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, storeId: store.id } });
  if (!customer) return { error: "Customer not found" };
  const pending = await getCustomerPending(store.id, customerId);
  const amount = round2(d.amount);
  if (amount > pending) return { error: `Amount cannot be more than the pending amount (${inr(pending)})` };

  await prisma.customerPayment.create({
    data: { storeId: store.id, customerId, date: toDbDate(d.date), amount, paymentMode: d.paymentMode, note: d.note },
  });
  refresh("/vendor/customers", `/vendor/customers/${customerId}`);
  return { success: `Payment of ${inr(amount)} received` };
}

export async function deletePayment(id: number, _prev: FormState): Promise<FormState> {
  const store = await requireVendor();
  const p = await prisma.customerPayment.findFirst({ where: { id, storeId: store.id } });
  if (!p) return { error: "Entry not found" };
  await prisma.customerPayment.delete({ where: { id } });
  refresh("/vendor/customers", `/vendor/customers/${p.customerId}`);
  return {};
}

/* ---------------- Password ---------------- */

export async function changeVendorPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = await requireVendor();
  const o = formObject(fd);
  const parsed = passwordSchema.safeParse(fd.get("newPassword"));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (o.newPassword !== o.confirmPassword) return { error: "New passwords do not match" };
  if (!(await bcrypt.compare(String(fd.get("currentPassword") ?? ""), store.passwordHash))) {
    return { error: "Current password is incorrect" };
  }
  const updated = await prisma.store.update({
    where: { id: store.id },
    data: { passwordHash: await bcrypt.hash(parsed.data, 10), tokenVersion: { increment: 1 } },
  });
  await setSessionCookie({ id: store.id, role: "VENDOR", tv: updated.tokenVersion });
  return { success: "Password changed" };
}
