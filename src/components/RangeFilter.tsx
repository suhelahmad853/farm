import Form from "next/form";
import Link from "next/link";
import { PrintButton } from "./PrintButton";
import { todayIST } from "@/lib/format";
import { quickRanges, rangeQuery, type DateRange } from "@/lib/range";
import { btnPrimary, btnSecondary, inputCls } from "./ui";

/** Date filter bar (single day or from–to) with quick ranges and PDF download. */
export function RangeFilter({ range, basePath, pdfPath }: { range: DateRange; basePath: string; pdfPath: string }) {
  const today = todayIST();
  return (
    <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 print:hidden">
      <div className="flex flex-wrap items-end gap-2">
        <Form action={basePath} className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">From</span>
            <input type="date" name="from" defaultValue={range.from} required className={`${inputCls} w-40`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">To</span>
            <input type="date" name="to" defaultValue={range.to} required className={`${inputCls} w-40`} />
          </label>
          <button type="submit" className={btnSecondary}>Apply</button>
        </Form>
        <div className="flex gap-2 sm:ml-auto">
          <PrintButton />
          <a href={`${pdfPath}?${rangeQuery(range)}`} className={btnPrimary} download>
            Download PDF
          </a>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickRanges(today).map((q) => {
          const active = q.from === range.from && q.to === range.to;
          return (
            <Link
              key={q.label}
              href={`${basePath}?${rangeQuery(q)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                active ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100"
              }`}
            >
              {q.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
