import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { StoreFields } from "@/components/StoreFields";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toggleStore, updateStore } from "../../actions";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) notFound();

  return (
    <>
      <PageHeader
        title={store.storeName}
        subtitle={`Created ${fmtDate(store.createdAt)}`}
        action={<Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">← All stores</Link>}
      />
      <div className="grid max-w-2xl grid-cols-1 gap-5">
        <Card title="Status">
          <div className="flex items-center justify-between gap-3">
            {store.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
            <ActionButton
              action={toggleStore.bind(null, store.id)}
              label={store.isActive ? "Deactivate store" : "Activate store"}
              variant={store.isActive ? "danger" : "default"}
              confirmText={store.isActive ? "Deactivate this store? The vendor will not be able to log in." : undefined}
            />
          </div>
        </Card>
        <Card title="Store details">
          <ActionForm action={updateStore.bind(null, store.id)} submitLabel="Save changes" resetOnSuccess={false}>
            <StoreFields store={store} isEdit />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
