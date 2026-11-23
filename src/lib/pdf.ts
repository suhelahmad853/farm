import { jsPDF } from "jspdf";
import { autoTable, type RowInput } from "jspdf-autotable";
import type { DateRange } from "./range";

/** Money for PDFs: the built-in PDF fonts have no ₹ glyph, so headers say "(Rs)". */
export function money(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type ReportInput = {
  title: string;
  store: { storeName: string; ownerName: string; mobile: string };
  range: DateRange;
  head: string[];
  body: RowInput[];
  foot?: RowInput;
  /** Column indexes to right-align (numbers). */
  numeric?: number[];
  landscape?: boolean;
};

export function buildReport(input: ReportInput): ArrayBuffer {
  const doc = new jsPDF({ orientation: input.landscape ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 36;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(input.store.storeName, margin, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`${input.store.ownerName} | ${input.store.mobile}`, margin, 64);

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(input.title, margin, 92);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Period: ${input.range.label}`, margin, 108);
  const generated = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  doc.setTextColor(90);
  doc.text(`Generated: ${generated}`, width - margin, 108, { align: "right" });
  doc.setTextColor(20);

  const columnStyles: Record<number, { halign: "right" }> = {};
  for (const i of input.numeric ?? []) columnStyles[i] = { halign: "right" };

  const body: RowInput[] = input.body.length
    ? input.body
    : [[{ content: "No entries for this period", colSpan: input.head.length, styles: { halign: "center", textColor: 120 } }]];

  autoTable(doc, {
    startY: 122,
    margin: { left: margin, right: margin },
    head: [input.head],
    body,
    foot: input.foot && input.body.length ? [input.foot] : undefined,
    showFoot: "lastPage",
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: "bold" },
    columnStyles,
    // Column styles don't reach the totals row, so align its numbers here.
    didParseCell: (data) => {
      if (data.section === "foot" && input.numeric?.includes(data.column.index)) data.cell.styles.halign = "right";
    },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${pages}`, width - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }
  return doc.output("arraybuffer");
}

export function pdfResponse(data: ArrayBuffer, filename: string) {
  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
