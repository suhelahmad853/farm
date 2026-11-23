import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { RangeFilter } from "@/components/RangeFilter";
import { SaleForm } from "@/components/SaleForm";
import { Badge, Card, PageHeader, Table } from "@/components/ui";
import { getPendingMap, getStock, listSales, sumRows } from "@/lib/data";
import { fmtDate, inr, kg, MODE_LABEL, num, round2, SIZE_LABEL, todayIST } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { parseRange } from "@/lib/range";
import { requireVendor } from "@/lib/session";
import { addSale, deleteSale } from "../actions";

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const store = await requireVendor();
  const range = parseRange(await searchParams);
  const [sales, customers, stock, pending] = await Promise.all([
    listSales(store.id, range),
    prisma.customer.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
    getStock(store.id),
    getPendingMap(store.id),
  ]);

  const t = sumRows(sales);

  const customerOptions = customers.map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    defaultSize: c.defaultSize,
    defaultRate: c.defaultRate == null ? null : num(c.defaultRate),
    pending: pending.get(c.id) ?? 0,
  }));

  return (
    <>
      <PageHeader title="Sell" subtitle="Sales reduce stock. Unpaid amount is added to the customer's pending." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card title="New sale">
          <SaleForm action={addSale} customers={customerOptions} stock={stock} today={todayIST()} />
        </Card>

        <Card title={`Sales · ${range.label}`}>
          <RangeFilter range={range} basePath="/vendor/sales" pdfPath="/vendor/sales/pdf" />
          <Table
            head={["Date", "Customer", "Size", "Pcs", "Weight", "Rate", "Total", "Paid", "Pending", ""]}
            empty={sales.length === 0 && "No sales for this period."}
            foot={
              <tr>
                <td colSpan={3}>Total ({sales.length} entries)</td>
                <td className="tabular-nums">{t.pieces}</td>
                <td className="whitespace-nowrap tabular-nums">{kg(t.weightKg)}</td>
                <td />
                <td className="tabular-nums">{inr(t.total)}</td>
                <td className="tabular-nums">{inr(t.paid)}</td>
                <td className="tabular-nums text-amber-700">{inr(t.pending)}</td>
                <td />
              </tr>
            }
          >
            {sales.map((s) => {
              const due = round2(num(s.totalAmount) - num(s.paidAmount));
              return (
                <tr key={s.id}>
                  <td className="whitespace-nowrap">{fmtDate(s.date)}</td>
                  <td className="max-w-40 truncate">
                    {s.customerId ? (
                      <Link href={`/vendor/customers/${s.customerId}`} className="font-medium text-emerald-700 hover:underline">{s.customerName}</Link>
                    ) : (
                      <span className="text-slate-600">{s.customerName}</span>
                    )}
                  </td>
                  <td>{SIZE_LABEL[s.size]}</td>
                  <td className="tabular-nums">{s.pieces}</td>
                  <td className="whitespace-nowrap tabular-nums">{kg(num(s.weightKg))}</td>
                  <td className="tabular-nums">{inr(num(s.ratePerKg))}</td>
                  <td className="font-semibold tabular-nums">{inr(num(s.totalAmount))}</td>
                  <td className="whitespace-nowrap tabular-nums">
                    {inr(num(s.paidAmount))} <span className="text-xs text-slate-500">{MODE_LABEL[s.paymentMode]}</span>
                  </td>
                  <td>{due > 0 ? <Badge tone="amber">{inr(due)}</Badge> : <Badge tone="green">Paid</Badge>}</td>
                  <td><ActionButton action={deleteSale.bind(null, s.id)} label="Delete" confirmText="Delete this sale?" /></td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </>
  );
}
