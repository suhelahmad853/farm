import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/ui";
import { getDashboardTotals, getPendingMap, getStock } from "@/lib/data";
import { inr, kg, round2, SIZE_LABEL, toDbDate, todayIST } from "@/lib/format";
import { requireVendor } from "@/lib/session";

export default async function VendorDashboard() {
  const store = await requireVendor();
  const storeId = store.id;
  const today = todayIST();
  const todayDate = toDbDate(today);

  const [stock, pendingMap, totals] = await Promise.all([
    getStock(storeId),
    getPendingMap(storeId),
    getDashboardTotals(storeId, today, today.slice(0, 8) + "01"),
  ]);
  const todayTotals = totals.today;
  const monthTotals = totals.month;
  const totalPending = round2([...pendingMap.values()].reduce((a, b) => a + b, 0));
  const pendingCustomers = [...pendingMap.values()].filter((v) => v > 0).length;
  const monthProfit = round2(monthTotals.sales - monthTotals.purchases - monthTotals.expenses);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Today: ${new Date(todayDate).toLocaleDateString("en-IN", { timeZone: "UTC", dateStyle: "full" })}`} />

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Stock in hand</h2>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stock.map((s) => (
          <Stat key={s.size} label={SIZE_LABEL[s.size]} value={`${s.pieces} pcs`} sub={kg(s.weightKg)} tone={s.pieces > 0 ? "good" : "default"} />
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Today</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Sales" value={inr(todayTotals.sales)} />
        <Stat label="Purchases" value={inr(todayTotals.purchases)} />
        <Stat label="Expenses" value={inr(todayTotals.expenses)} />
        <Stat label="Cash received" value={inr(todayTotals.cash)} tone="good" />
        <Stat label="Online received" value={inr(todayTotals.online)} tone="good" />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">This month</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales" value={inr(monthTotals.sales)} />
        <Stat label="Purchases" value={inr(monthTotals.purchases)} />
        <Stat label="Expenses" value={inr(monthTotals.expenses)} />
        <Stat label="Sales − purchases − expenses" value={inr(monthProfit)} tone={monthProfit >= 0 ? "good" : "warn"} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total pending from customers</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{inr(totalPending)}</div>
            <div className="text-xs text-slate-500">{pendingCustomers} customer(s) with pending amount</div>
          </div>
          <Link href="/vendor/customers" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">View customers →</Link>
        </div>
      </Card>
    </>
  );
}
