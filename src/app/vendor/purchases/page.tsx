import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { RangeFilter } from "@/components/RangeFilter";
import { SizeSelect } from "@/components/SizeSelect";
import { TotalPreview } from "@/components/TotalPreview";
import { Card, Field, inputCls, PageHeader, Table } from "@/components/ui";
import { listPurchases, sumRows } from "@/lib/data";
import { fmtDate, inr, kg, num, SIZE_LABEL, todayIST } from "@/lib/format";
import { parseRange } from "@/lib/range";
import { requireVendor } from "@/lib/session";
import { addPurchase, deletePurchase } from "../actions";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const store = await requireVendor();
  const range = parseRange(await searchParams);
  const purchases = await listPurchases(store.id, range);
  const t = sumRows(purchases);

  return (
    <>
      <PageHeader title="Purchase" subtitle="Chicken bought for the farm. Purchases add to stock." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)] print:block">
        <Card title="Add purchase" className="print:hidden">
          <ActionForm action={addPurchase} submitLabel="Save purchase">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><input type="date" name="date" required defaultValue={todayIST()} className={inputCls} /></Field>
              <Field label="Size"><SizeSelect /></Field>
              <Field label="Pieces"><input type="number" name="pieces" min={1} step={1} required className={inputCls} /></Field>
              <Field label="Weight (kg)"><input type="number" name="weightKg" min={0.001} step={0.001} required className={inputCls} /></Field>
              <Field label="Rate (₹ per kg)"><input type="number" name="ratePerKg" min={0.01} step={0.01} required className={inputCls} /></Field>
              <Field label="Supplier"><input name="supplierName" maxLength={100} className={inputCls} /></Field>
            </div>
            <Field label="Note (optional)"><input name="note" maxLength={255} className={inputCls} /></Field>
            <TotalPreview />
          </ActionForm>
        </Card>

        <Card title={`Purchases · ${range.label}`} className="print:border-0 print:p-0 print:shadow-none">
          <RangeFilter range={range} basePath="/vendor/purchases" pdfPath="/vendor/purchases/pdf" />
          <Table
            head={["Date", "Size", "Pieces", "Weight", "Rate/kg", "Total", "Supplier", ""]}
            empty={purchases.length === 0 && "No purchases for this period."}
            foot={
              <tr>
                <td colSpan={2}>Total ({purchases.length} entries)</td>
                <td className="tabular-nums">{t.pieces}</td>
                <td className="whitespace-nowrap tabular-nums">{kg(t.weightKg)}</td>
                <td />
                <td className="tabular-nums">{inr(t.total)}</td>
                <td />
                <td className="print:hidden" />
              </tr>
            }
          >
            {purchases.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{fmtDate(p.date)}</td>
                <td>{SIZE_LABEL[p.size]}</td>
                <td className="tabular-nums">{p.pieces}</td>
                <td className="whitespace-nowrap tabular-nums">{kg(num(p.weightKg))}</td>
                <td className="tabular-nums">{inr(num(p.ratePerKg))}</td>
                <td className="font-semibold tabular-nums">{inr(num(p.totalAmount))}</td>
                <td className="max-w-40 truncate print:max-w-none print:whitespace-normal" title={p.note ?? undefined}>{p.supplierName ?? "—"}</td>
                <td className="print:hidden"><ActionButton action={deletePurchase.bind(null, p.id)} label="Delete" confirmText="Delete this purchase?" /></td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
