import { PasswordForm } from "@/components/PasswordForm";
import { Card, PageHeader } from "@/components/ui";
import { changeAdminPassword } from "../actions";

export default function AdminPasswordPage() {
  return (
    <>
      <PageHeader title="Change Password" />
      <Card className="max-w-md">
        <PasswordForm action={changeAdminPassword} />
      </Card>
    </>
  );
}
