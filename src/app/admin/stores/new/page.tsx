import { ActionForm } from "@/components/ActionForm";
import { StoreFields } from "@/components/StoreFields";
import { Card, PageHeader } from "@/components/ui";
import { createStore } from "../../actions";

export default function NewStorePage() {
  return (
    <>
      <PageHeader title="Add Store" subtitle="The vendor logs in with this mobile number and password" />
      <Card className="max-w-2xl">
        <ActionForm action={createStore} submitLabel="Create store" resetOnSuccess={false}>
          <StoreFields />
        </ActionForm>
      </Card>
    </>
  );
}
