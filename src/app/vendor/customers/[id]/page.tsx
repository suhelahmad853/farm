import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { CustomerFields } from "@/components/CustomerFields";
import { Badge, Card, Field, inputCls, PageHeader, Stat, Table } from "@/components/ui";
import { fmtDate, inr, kg, MODE_LABEL, num, PAYMENT_MODES, round2, SIZE_LABEL, todayIST } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/session";
import { addPayment, deleteCustomer, deletePayment, deleteSale, updateCustomer } from "../../actions";

type Row =
  | { kind: "sale"; id: number; date: Date; createdAt: Date; detail: string; debit: number; credit: number; mode: string }
  | { kind: "payment"; id: number; date: Date; createdAt: Date; detail: string; debit: number; credit: number; mode: string };

export default async function CustomerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const store = await requireVendor();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const customer = await prisma.customer.findFirst({
    where: { id, storeId: store.id },
    include: { sales: true, payments: true },
  });
  if (!customer) notFound();

  const rows: Row[] = [
    ...customer.sales.map((s) => ({
      kind: "sale" as const,
      id: s.id,
      date: s.date,
      createdAt: s.createdAt,
      detail: `${SIZE_LABEL[s.size]} · ${s.pieces} pcs · ${kg(num(s.weightKg))} @ ${inr(num(s.ratePerKg))}`,
      debit: num(s.totalAmount),
      credit: num(s.paidAmount),
      mode: MODE_LABEL[s.paymentMode],
    })),
    ...customer.payments.map((p) => ({
      kind: "payment" as const,
      id: p.id,
      date: p.date,
      createdAt: p.createdAt,
      detail: p.note ? `Payment received · ${p.note}` : "Payment received",
      debit: 0,
      credit: num(p.amount),
      mode: MODE_LABEL[p.paymentMode],
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime());

  // Running balance, oldest first; shown newest first.
  let balance = 0;
  const ledger = rows.map((r) => {
    balance = round2(balance + r.debit - r.credit);
    return { ...r, balance };
  }).reverse();

  const totalSales = round2(rows.reduce((a, r) => a + r.debit, 0));
  const totalPaid = round2(rows.reduce((a, r) => a + r.credit, 0));
  const pending = round2(totalSales - totalPaid);

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={[customer.mobile, customer.address].filter(Boolean).join(" · ") || "Customer ledger"}
        action={<Link href="/vendor/customers" className="text-sm text-slate-600 hover:text-slate-900">← All customers</Link>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Total sales" value={inr(totalSales)} />
        <Stat label="Total paid" value={inr(totalPaid)} tone="good" />
        <Stat label="Pending" value={inr(pending)} tone={pending > 0 ? "warn" : "good"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card title="Receive payment">
            {pending > 0 ? (
              <ActionForm action={addPayment.bind(null, customer.id)} submitLabel="Save payment">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date"><input type="date" name="date" required defaultValue={todayIST()} className={inputCls} /></Field>
                  <Field label="Amount (₹)">
                    <input type="number" name="amount" min={0.01} max={pending} step={0.01} required defaultValue={pending} className={inputCls} />
                  </Field>
                  <Field label="Mode">
                    <select name="paymentMode" defaultValue="CASH" className={inputCls}>
                      {PAYMENT_MODES.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                    </select>
                  </Field>
                  <Field label="Note"><input name="note" maxLength={255} className={inputCls} /></Field>
                </div>
              </ActionForm>
            ) : (
              <p className="text-sm text-slate-500">No pending amount.</p>
            )}
          </Card>

          <Card title="Edit customer">
            <ActionForm action={updateCustomer.bind(null, customer.id)} submitLabel="Save changes" resetOnSuccess={false}>
              <CustomerFields c={{ ...customer, defaultRate: customer.defaultRate == null ? null : num(customer.defaultRate) }} />
            </ActionForm>
            {rows.length === 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ActionButton action={deleteCustomer.bind(null, customer.id)} label="Delete customer" confirmText="Delete this customer?" />
              </div>
            )}
          </Card>
        </div>

        <Card title="Ledger (KhataBook)">
          <Table head={["Date", "Details", "Sale", "Paid", "Balance", ""]} empty={ledger.length === 0}>
            {ledger.map((r) => (
              <tr key={`${r.kind}-${r.id}`}>
                <td className="whitespace-nowrap">{fmtDate(r.date)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.kind === "sale" ? "slate" : "green"}>{r.kind === "sale" ? "Sale" : "Payment"}</Badge>
                    <span className="text-slate-700">{r.detail}</span>
                  </div>
                </td>
                <td className="tabular-nums">{r.debit ? inr(r.debit) : "—"}</td>
                <td className="whitespace-nowrap tabular-nums">
                  {r.credit ? <>{inr(r.credit)} <span className="text-xs text-slate-500">{r.mode}</span></> : "—"}
                </td>
                <td className="font-semibold tabular-nums">{inr(r.balance)}</td>
                <td>
                  <ActionButton
                    action={r.kind === "sale" ? deleteSale.bind(null, r.id) : deletePayment.bind(null, r.id)}
                    label="Delete"
                    confirmText={`Delete this ${r.kind}?`}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
