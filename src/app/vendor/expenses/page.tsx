import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { Card, Field, inputCls, PageHeader, Table } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABEL, fmtDate, inr, num, toDbDate, todayIST } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/session";
import { addExpense, deleteExpense } from "../actions";

export default async function ExpensesPage() {
  const store = await requireVendor();
  const monthStart = toDbDate(todayIST().slice(0, 8) + "01");
  const [expenses, monthByCategory] = await Promise.all([
    prisma.expense.findMany({ where: { storeId: store.id }, orderBy: [{ date: "desc" }, { id: "desc" }], take: 100 }),
    prisma.expense.groupBy({ by: ["category"], where: { storeId: store.id, date: { gte: monthStart } }, _sum: { amount: true } }),
  ]);
  const monthTotal = monthByCategory.reduce((a, r) => a + num(r._sum.amount), 0);

  return (
    <>
      <PageHeader title="Expense" subtitle="Rent, labour, petrol, bike maintenance, feed and other farm expenses" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
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
          <Card title="This month by category">
            <ul className="divide-y divide-slate-100 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c} className="flex justify-between py-1.5">
                  <span className="text-slate-600">{CATEGORY_LABEL[c]}</span>
                  <span className="tabular-nums">{inr(num(monthByCategory.find((r) => r.category === c)?._sum.amount))}</span>
                </li>
              ))}
              <li className="flex justify-between py-1.5 font-semibold">
                <span>Total</span><span className="tabular-nums">{inr(monthTotal)}</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card title="Recent expenses">
          <Table head={["Date", "Category", "Amount", "Description", ""]} empty={expenses.length === 0}>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="whitespace-nowrap">{CATEGORY_LABEL[e.category]}</td>
                <td className="font-semibold tabular-nums">{inr(num(e.amount))}</td>
                <td className="max-w-64 text-slate-600">{e.description ?? "—"}</td>
                <td><ActionButton action={deleteExpense.bind(null, e.id)} label="Delete" confirmText="Delete this expense?" /></td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
