import type { NextRequest } from "next/server";
import { listExpenses } from "@/lib/data";
import { CATEGORY_LABEL, fmtDate, num, round2 } from "@/lib/format";
import { buildReport, money, pdfResponse } from "@/lib/pdf";
import { parseRange } from "@/lib/range";
import { requireVendor } from "@/lib/session";

export async function GET(req: NextRequest) {
  const store = await requireVendor();
  const range = parseRange(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await listExpenses(store.id, range);
  const total = round2(rows.reduce((a, e) => a + num(e.amount), 0));

  const pdf = buildReport({
    title: "Expense Report",
    store,
    range,
    head: ["Date", "Category", "Amount (Rs)", "Description"],
    numeric: [2],
    body: rows.map((e) => [fmtDate(e.date), CATEGORY_LABEL[e.category], money(num(e.amount)), e.description ?? ""]),
    foot: [`Total (${rows.length})`, "", money(total), ""],
  });
  return pdfResponse(pdf, `expenses_${range.from}_to_${range.to}.pdf`);
}
