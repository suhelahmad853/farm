import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { RangeFilter } from "@/components/RangeFilter";
import { Card, Field, inputCls, PageHeader, Table } from "@/components/ui";
import { listExpenses } from "@/lib/data";
import { CATEGORIES, CATEGORY_LABEL, fmtDate, inr, num, round2, todayIST } from "@/lib/format";
import { parseRange } from "@/lib/range";
import { requireVendor } from "@/lib/session";
import { addExpense, deleteExpense } from "../actions";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const store = await requireVendor();
  const range = parseRange(await searchParams);
  const expenses = await listExpenses(store.id, range);

  const total = round2(expenses.reduce((a, e) => a + num(e.amount), 0));
  const byCategory = CATEGORIES.map((c) => ({
    c,
    amount: round2(expenses.filter((e) => e.category === c).reduce((a, e) => a + num(e.amount), 0)),
  }));

  return (
    <>
      <PageHeader title="Expense" subtitle="Rent, labour, petrol, bike maintenance, feed and other farm expenses" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)] print:block">
        <div className="space-y-5 print:hidden">
          <Card title="Add expense">
            <ActionForm action={addExpense} submitLabel="Save expense">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date"><input type="date" name="date" required defaultValue={todayIST()} className={inputCls} /></Field>
                <Field label="Amount (₹)"><input type="number" name="amount" min={0.01} step={0.01} required className={inputCls} /></Field>
              </div>
              <Field label="Category">
                <select name="category" required defaultValue="" className={inputCls}>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </Field>
              <Field label="Description" hint="What the money was used for (required for Labour and Other)">
                <textarea name="description" rows={2} maxLength={255} className={inputCls} />
              </Field>
            </ActionForm>
          </Card>
          <Card title={`By category · ${range.label}`}>
            <ul className="divide-y divide-slate-100 text-sm">
              {byCategory.map(({ c, amount }) => (
                <li key={c} className="flex justify-between py-1.5">
                  <span className="text-slate-600">{CATEGORY_LABEL[c]}</span>
                  <span className="tabular-nums">{inr(amount)}</span>
                </li>
              ))}
              <li className="flex justify-between py-1.5 font-semibold">
                <span>Total</span><span className="tabular-nums">{inr(total)}</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card title={`Expenses · ${range.label}`} className="print:border-0 print:p-0 print:shadow-none">
          <RangeFilter range={range} basePath="/vendor/expenses" pdfPath="/vendor/expenses/pdf" />
          <Table
            head={["Date", "Category", "Amount", "Description", ""]}
            empty={expenses.length === 0 && "No expenses for this period."}
            foot={
              <tr>
                <td colSpan={2}>Total ({expenses.length} entries)</td>
                <td className="tabular-nums">{inr(total)}</td>
                <td />
                <td className="print:hidden" />
              </tr>
            }
          >
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="whitespace-nowrap">{CATEGORY_LABEL[e.category]}</td>
                <td className="font-semibold tabular-nums">{inr(num(e.amount))}</td>
                <td className="max-w-64 text-slate-600 print:max-w-none">{e.description ?? "—"}</td>
                <td className="print:hidden"><ActionButton action={deleteExpense.bind(null, e.id)} label="Delete" confirmText="Delete this expense?" /></td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
