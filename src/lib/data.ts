import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { num, round2, SIZES, type SizeKey } from "./format";

export type StockRow = { size: SizeKey; pieces: number; weightKg: number };

/** Stock per size = total purchased − total sold. One query. */
export async function getStock(storeId: number): Promise<StockRow[]> {
  const rows = await prisma.$queryRaw<{ size: string; pieces: unknown; kg: unknown }[]>`
    SELECT size, SUM(pieces) AS pieces, SUM(kg) AS kg FROM (
      SELECT size, pieces, weight_kg AS kg FROM purchases WHERE store_id = ${storeId}
      UNION ALL
      SELECT size, -pieces, -weight_kg FROM sales WHERE store_id = ${storeId}
    ) t GROUP BY size`;
  return SIZES.map((size) => {
    const r = rows.find((x) => x.size === size);
    return { size, pieces: num(r?.pieces), weightKg: round2(num(r?.kg)) };
  });
}

/** Pending amount per customer id = Σ(sale total − paid at sale) − Σ later payments. One query. */
export async function getPendingMap(storeId: number, customerId?: number): Promise<Map<number, number>> {
  const onlyCustomer = customerId ? Prisma.sql`AND customer_id = ${customerId}` : Prisma.empty;
  const rows = await prisma.$queryRaw<{ customerId: number; pending: unknown }[]>`
    SELECT customer_id AS customerId, SUM(amt) AS pending FROM (
      SELECT customer_id, total_amount - paid_amount AS amt FROM sales
        WHERE store_id = ${storeId} AND customer_id IS NOT NULL ${onlyCustomer}
      UNION ALL
      SELECT customer_id, -amount FROM customer_payments WHERE store_id = ${storeId} ${onlyCustomer}
    ) t GROUP BY customer_id`;
  return new Map(rows.map((r) => [Number(r.customerId), round2(num(r.pending))]));
}

export type PeriodTotals = { purchases: number; sales: number; expenses: number; cash: number; online: number };

/**
 * Dashboard totals for today and for the month, in one query.
 * Received = paid at sale + later customer payments, split by payment mode.
 */
export async function getDashboardTotals(storeId: number, today: string, monthStart: string) {
  const rows = await prisma.$queryRaw<{ k: string; m: string; today: unknown; month: unknown }[]>`
    SELECT k, m, SUM(CASE WHEN d >= ${today} THEN a ELSE 0 END) AS today, SUM(a) AS month FROM (
      SELECT 'P' AS k, '' AS m, date AS d, total_amount AS a FROM purchases WHERE store_id = ${storeId} AND date >= ${monthStart}
      UNION ALL SELECT 'S', '', date, total_amount FROM sales WHERE store_id = ${storeId} AND date >= ${monthStart}
      UNION ALL SELECT 'E', '', date, amount FROM expenses WHERE store_id = ${storeId} AND date >= ${monthStart}
      UNION ALL SELECT 'R', CAST(payment_mode AS CHAR), date, paid_amount FROM sales WHERE store_id = ${storeId} AND date >= ${monthStart}
      UNION ALL SELECT 'R', CAST(payment_mode AS CHAR), date, amount FROM customer_payments WHERE store_id = ${storeId} AND date >= ${monthStart}
    ) t GROUP BY k, m`;
  const pick = (period: "today" | "month"): PeriodTotals => {
    const v = (k: string, m = "") => round2(num(rows.find((r) => r.k === k && r.m === m)?.[period]));
    return { purchases: v("P"), sales: v("S"), expenses: v("E"), cash: v("R", "CASH"), online: v("R", "ONLINE") };
  };
  return { today: pick("today"), month: pick("month") };
}

export async function getCustomerPending(storeId: number, customerId: number) {
  return (await getPendingMap(storeId, customerId)).get(customerId) ?? 0;
}

/* ---------- Filtered lists (used by pages and PDF export) ---------- */

type Range = { gte: Date; lte: Date };

export function listPurchases(storeId: number, r: Range) {
  return prisma.purchase.findMany({
    where: { storeId, date: { gte: r.gte, lte: r.lte } },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
}

export function listSales(storeId: number, r: Range) {
  return prisma.sale.findMany({
    where: { storeId, date: { gte: r.gte, lte: r.lte } },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
}

export function listExpenses(storeId: number, r: Range) {
  return prisma.expense.findMany({
    where: { storeId, date: { gte: r.gte, lte: r.lte } },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
}

type Summable = { pieces: number; weightKg: unknown; totalAmount: unknown; paidAmount?: unknown };

/** Totals for a list of purchases or sales. */
export function sumRows(rows: Summable[]) {
  let pieces = 0, weightKg = 0, total = 0, paid = 0;
  for (const r of rows) {
    pieces += r.pieces;
    weightKg += num(r.weightKg);
    total += num(r.totalAmount);
    paid += num(r.paidAmount);
  }
  return { pieces, weightKg: round2(weightKg), total: round2(total), paid: round2(paid), pending: round2(total - paid) };
}
