import { PasswordForm } from "@/components/PasswordForm";
import { Card, PageHeader } from "@/components/ui";
import { changeVendorPassword } from "../actions";

export default function VendorPasswordPage() {
  return (
    <>
      <PageHeader title="Change Password" />
      <Card className="max-w-md">
        <PasswordForm action={changeVendorPassword} />
      </Card>
    </>
  );
}
