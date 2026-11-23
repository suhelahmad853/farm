// Shared helpers — safe to import from client and server components.

export const SIZES = ["SMALL", "MEDIUM", "BIG"] as const;
export type SizeKey = (typeof SIZES)[number];

export const SIZE_LABEL: Record<SizeKey, string> = {
  SMALL: "Small",
  MEDIUM: "Medium",
  BIG: "Big",
};

export const CATEGORIES = ["RENT", "LABOUR", "PETROL", "BIKE_MAINTENANCE", "FEED", "OTHER"] as const;
export type CategoryKey = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  RENT: "Rent",
  LABOUR: "Labour",
  PETROL: "Petrol",
  BIKE_MAINTENANCE: "Bike Maintenance",
  FEED: "Feed (Dana)",
  OTHER: "Other",
};

export const PAYMENT_MODES = ["CASH", "ONLINE"] as const;
export const MODE_LABEL: Record<(typeof PAYMENT_MODES)[number], string> = {
  CASH: "Cash",
  ONLINE: "Online",
};

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Converts Prisma Decimal / null to a plain number. */
export function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

export function inr(n: number) {
  const text = "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return n < 0 ? "−" + text : text;
}

export function kg(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 3 }) + " kg";
}

/** Today's date (YYYY-MM-DD) in India time. */
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Converts YYYY-MM-DD to a Date for a MySQL DATE column. */
export function toDbDate(s: string) {
  return new Date(`${s}T00:00:00.000Z`);
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
}
