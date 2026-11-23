import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { Badge, btnPrimary, Card, PageHeader, Stat, Table } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toggleStore } from "./actions";

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({ orderBy: { createdAt: "desc" } });
  const active = stores.filter((s) => s.isActive).length;

  return (
    <>
      <PageHeader
        title="Stores"
        subtitle="Create and manage vendor stores"
        action={<Link href="/admin/stores/new" className={btnPrimary}>+ Add Store</Link>}
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Total" value={String(stores.length)} />
        <Stat label="Active" value={String(active)} tone="good" />
        <Stat label="Inactive" value={String(stores.length - active)} tone="warn" />
      </div>
      <Card>
        <Table head={["Store", "Owner", "Mobile", "Status", "Created", "Actions"]} empty={stores.length === 0}>
          {stores.map((s) => (
            <tr key={s.id}>
              <td className="font-medium text-slate-900">{s.storeName}</td>
              <td>{s.ownerName}</td>
              <td className="tabular-nums">{s.mobile}</td>
              <td>{s.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
              <td className="whitespace-nowrap">{fmtDate(s.createdAt)}</td>
              <td className="whitespace-nowrap">
                <div className="flex items-center gap-4">
                  <Link href={`/admin/stores/${s.id}`} className="text-sm font-medium text-slate-700 hover:text-slate-900">Edit</Link>
                  <ActionButton
                    action={toggleStore.bind(null, s.id)}
                    label={s.isActive ? "Deactivate" : "Activate"}
                    variant={s.isActive ? "danger" : "default"}
                    confirmText={s.isActive ? `Deactivate ${s.storeName}? The vendor will not be able to log in.` : undefined}
                  />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
