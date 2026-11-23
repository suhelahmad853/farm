import { z } from "zod";

/** Reads a FormData into a plain object of trimmed strings. */
export function formObject(fd: FormData) {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    // Passwords are kept exactly as typed.
    o[k] = /password/i.test(k) ? v : v.trim();
  }
  return o;
}

/** First zod error message, for showing in the form. */
export function firstError(err: z.ZodError) {
  return err.issues[0]?.message ?? "Invalid input";
}

export const mobileSchema = z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits");
export const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date");
export const optionalText = (max: number) =>
  z
    .string()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .transform((v) => (v ? v : null));
export const positiveNumber = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).positive(`${label} must be greater than 0`).max(1e9, `${label} is too large`);
