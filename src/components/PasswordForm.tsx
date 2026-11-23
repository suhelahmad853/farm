import type { FormState } from "@/lib/types";
import { ActionForm } from "./ActionForm";
import { Field, inputCls } from "./ui";

export function PasswordForm({ action }: { action: (prev: FormState, fd: FormData) => Promise<FormState> }) {
  return (
    <ActionForm action={action} submitLabel="Change password">
      <Field label="Current password">
        <input name="currentPassword" type="password" required className={inputCls} autoComplete="current-password" />
      </Field>
      <Field label="New password" hint="Minimum 6 characters">
        <input name="newPassword" type="password" required minLength={6} className={inputCls} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password">
        <input name="confirmPassword" type="password" required minLength={6} className={inputCls} autoComplete="new-password" />
      </Field>
    </ActionForm>
  );
}
