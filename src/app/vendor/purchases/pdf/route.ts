import type { NextRequest } from "next/server";
import { listPurchases, sumRows } from "@/lib/data";
import { fmtDate, num, SIZE_LABEL } from "@/lib/format";
import { buildReport, money, pdfResponse } from "@/lib/pdf";
import { parseRange } from "@/lib/range";
import { requireVendor } from "@/lib/session";

export async function GET(req: NextRequest) {
  const store = await requireVendor();
  const range = parseRange(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await listPurchases(store.id, range);
  const t = sumRows(rows);

  const pdf = buildReport({
    title: "Purchase Report",
    store,
    range,
    head: ["Date", "Size", "Pieces", "Weight (kg)", "Rate/kg (Rs)", "Total (Rs)", "Supplier", "Note"],
    numeric: [2, 3, 4, 5],
    body: rows.map((p) => [
      fmtDate(p.date),
      SIZE_LABEL[p.size],
      String(p.pieces),
      num(p.weightKg).toFixed(3),
      money(num(p.ratePerKg)),
      money(num(p.totalAmount)),
      p.supplierName ?? "",
      p.note ?? "",
    ]),
    foot: [`Total (${rows.length})`, "", String(t.pieces), t.weightKg.toFixed(3), "", money(t.total), "", ""],
  });
  return pdfResponse(pdf, `purchases_${range.from}_to_${range.to}.pdf`);
}
