import type { Invoice, Mode, Resume } from "./schemas";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const row = (cells: unknown[]) => cells.map(esc).join(",");

export function toCsv(mode: Mode, data: Invoice | Resume): string {
  if (mode === "invoice") {
    const d = data as Invoice;
    const lines = [row(["vendor", "invoice_number", "date", "description", "quantity", "unit_price", "total"])];
    for (const i of d.items) {
      lines.push(row([d.vendor, d.invoiceNumber, d.date, i.description, i.quantity, i.unitPrice, i.total]));
    }
    lines.push(row([d.vendor, d.invoiceNumber, d.date, "TOTAL (incl. tax " + (d.tax ?? 0) + ")", "", "", d.total]));
    return lines.join("\n");
  }
  const d = data as Resume;
  const lines = [row(["full_name", "email", "company", "title", "start", "end", "description"])];
  for (const e of d.experience) {
    lines.push(row([d.fullName, d.email, e.company, e.title, e.start, e.end, e.description]));
  }
  return lines.join("\n");
}

export function downloadCsv(mode: Mode, data: Invoice | Resume) {
  const blob = new Blob(["\uFEFF" + toCsv(mode, data)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${mode}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
