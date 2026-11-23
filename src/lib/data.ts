import { prisma } from "./prisma";
import { num, round2, SIZES, type SizeKey } from "./format";

export type StockRow = { size: SizeKey; pieces: number; weightKg: number };

/** Stock per size = total purchased − total sold. */
export async function getStock(storeId: number): Promise<StockRow[]> {
  const [bought, sold] = await Promise.all([
    prisma.purchase.groupBy({ by: ["size"], where: { storeId }, _sum: { pieces: true, weightKg: true } }),
    prisma.sale.groupBy({ by: ["size"], where: { storeId }, _sum: { pieces: true, weightKg: true } }),
  ]);
  return SIZES.map((size) => {
    const b = bought.find((r) => r.size === size)?._sum;
    const s = sold.find((r) => r.size === size)?._sum;
    return {
      size,
      pieces: (b?.pieces ?? 0) - (s?.pieces ?? 0),
      weightKg: round2(num(b?.weightKg) - num(s?.weightKg)),
    };
  });
}

/** Pending amount per customer id = Σ(sale total − paid at sale) − Σ later payments. */
export async function getPendingMap(storeId: number, customerId?: number): Promise<Map<number, number>> {
  const saleWhere = customerId ? { storeId, customerId } : { storeId, customerId: { not: null } };
  const [sales, payments] = await Promise.all([
    prisma.sale.groupBy({ by: ["customerId"], where: saleWhere, _sum: { totalAmount: true, paidAmount: true } }),
    prisma.customerPayment.groupBy({
      by: ["customerId"],
      where: customerId ? { storeId, customerId } : { storeId },
      _sum: { amount: true },
    }),
  ]);
  const map = new Map<number, number>();
  for (const s of sales) {
    if (s.customerId == null) continue;
    map.set(s.customerId, num(s._sum.totalAmount) - num(s._sum.paidAmount));
  }
  for (const p of payments) {
    map.set(p.customerId, (map.get(p.customerId) ?? 0) - num(p._sum.amount));
  }
  for (const [k, v] of map) map.set(k, round2(v));
  return map;
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
