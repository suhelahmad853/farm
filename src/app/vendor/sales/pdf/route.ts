import type { NextRequest } from "next/server";
import { listSales, sumRows } from "@/lib/data";
import { fmtDate, MODE_LABEL, num, round2, SIZE_LABEL } from "@/lib/format";
import { buildReport, money, pdfResponse } from "@/lib/pdf";
import { parseRange } from "@/lib/range";
import { requireVendor } from "@/lib/session";

export async function GET(req: NextRequest) {
  const store = await requireVendor();
  const range = parseRange(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await listSales(store.id, range);
  const t = sumRows(rows);

  const pdf = buildReport({
    title: "Sales Report",
    store,
    range,
    landscape: true,
    head: ["Date", "Customer", "Size", "Pcs", "Weight (kg)", "Rate/kg (Rs)", "Total (Rs)", "Paid (Rs)", "Mode", "Pending (Rs)"],
    numeric: [3, 4, 5, 6, 7, 9],
    body: rows.map((s) => [
      fmtDate(s.date),
      s.customerName,
      SIZE_LABEL[s.size],
      String(s.pieces),
      num(s.weightKg).toFixed(3),
      money(num(s.ratePerKg)),
      money(num(s.totalAmount)),
      money(num(s.paidAmount)),
      MODE_LABEL[s.paymentMode],
      money(round2(num(s.totalAmount) - num(s.paidAmount))),
    ]),
    foot: [`Total (${rows.length})`, "", "", String(t.pieces), t.weightKg.toFixed(3), "", money(t.total), money(t.paid), "", money(t.pending)],
  });
  return pdfResponse(pdf, `sales_${range.from}_to_${range.to}.pdf`);
}
