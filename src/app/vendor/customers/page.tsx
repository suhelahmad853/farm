import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { CustomerFields } from "@/components/CustomerFields";
import { Badge, Card, PageHeader, Table } from "@/components/ui";
import { getPendingMap } from "@/lib/data";
import { inr, num, round2, SIZE_LABEL } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/session";
import { addCustomer } from "../actions";

export default async function CustomersPage() {
  const store = await requireVendor();
  const [customers, pending] = await Promise.all([
    prisma.customer.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
    getPendingMap(store.id),
  ]);
  const totalPending = round2(customers.reduce((a, c) => a + (pending.get(c.id) ?? 0), 0));

  return (
    <>
      <PageHeader title="Customers" subtitle={`KhataBook · Total pending ${inr(totalPending)}`} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card title="Add customer">
          <ActionForm action={addCustomer} submitLabel="Add customer">
            <CustomerFields />
          </ActionForm>
        </Card>

        <Card title="Customer list">
          <Table head={["Name", "Mobile", "Default", "Pending", ""]} empty={customers.length === 0}>
            {customers.map((c) => {
              const due = pending.get(c.id) ?? 0;
              return (
                <tr key={c.id}>
                  <td className="font-medium text-slate-900">
                    <Link href={`/vendor/customers/${c.id}`} className="hover:underline">{c.name}</Link>
                  </td>
                  <td className="tabular-nums">{c.mobile ?? "—"}</td>
                  <td className="whitespace-nowrap text-slate-600">
                    {c.defaultSize ? SIZE_LABEL[c.defaultSize] : "—"}
                    {c.defaultRate != null && ` · ${inr(num(c.defaultRate))}/kg`}
                  </td>
                  <td>{due > 0 ? <Badge tone="amber">{inr(due)}</Badge> : <Badge tone="green">Clear</Badge>}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/vendor/customers/${c.id}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Open ledger →</Link>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </>
  );
}
