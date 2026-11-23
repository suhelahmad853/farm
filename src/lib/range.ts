import { fmtDate, todayIST, toDbDate } from "./format";

export type DateRange = { from: string; to: string; gte: Date; lte: Date; label: string };

type Params = Record<string, string | string[] | undefined>;

function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDbDate(s).toISOString().slice(0, 10) === s;
}

/** Reads ?from=YYYY-MM-DD&to=YYYY-MM-DD. Defaults to today; only `from` = that single day. */
export function parseRange(params: Params): DateRange {
  let from = isValidDate(params.from) ? params.from : todayIST();
  let to = isValidDate(params.to) ? params.to : from;
  if (from > to) [from, to] = [to, from];
  return {
    from,
    to,
    gte: toDbDate(from),
    lte: toDbDate(to),
    label: from === to ? fmtDate(toDbDate(from)) : `${fmtDate(toDbDate(from))} to ${fmtDate(toDbDate(to))}`,
  };
}

export function addDays(s: string, n: number) {
  const d = toDbDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function quickRanges(today: string) {
  const monthStart = today.slice(0, 8) + "01";
  const lastMonthEnd = addDays(monthStart, -1);
  return [
    { label: "Today", from: today, to: today },
    { label: "Yesterday", from: addDays(today, -1), to: addDays(today, -1) },
    { label: "Last 7 days", from: addDays(today, -6), to: today },
    { label: "This month", from: monthStart, to: today },
    { label: "Last month", from: lastMonthEnd.slice(0, 8) + "01", to: lastMonthEnd },
  ];
}

export function rangeQuery(r: { from: string; to: string }) {
  return `from=${r.from}&to=${r.to}`;
}
