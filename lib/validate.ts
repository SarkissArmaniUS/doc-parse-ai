import type { Invoice } from "./schemas";

export type Issue = { severity: "error" | "warning"; message: string };

const TOL = 0.02;
const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(TOL, Math.abs(b) * 0.001);
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function validateInvoice(d: Invoice): Issue[] {
  const issues: Issue[] = [];

  if (d.items.length === 0) {
    issues.push({ severity: "error", message: "No line items found." });
  }
  if (d.total == null) {
    issues.push({ severity: "error", message: "Total amount not found." });
  }
  if (!d.vendor) issues.push({ severity: "warning", message: "Vendor not found." });
  if (!d.date) issues.push({ severity: "warning", message: "Date not found." });
  if (!d.currency) issues.push({ severity: "warning", message: "Currency not found." });

  d.items.forEach((it, i) => {
    if (it.quantity != null && it.unitPrice != null && it.total != null) {
      const expected = it.quantity * it.unitPrice;
      if (!close(expected, it.total)) {
        issues.push({
          severity: "warning",
          message: `Item ${i + 1}: ${it.quantity} × ${fmt(it.unitPrice)} = ${fmt(expected)}, but invoice shows ${fmt(it.total)}.`,
        });
      }
    }
  });

  const lineSum = d.items.reduce((s, it) => s + (it.total ?? 0), 0);
  const base = d.subtotal ?? (d.tax == null ? d.total : null);
  if (base != null && d.items.length > 0 && !close(lineSum, base)) {
    issues.push({
      severity: "error",
      message: `Sum of items ${fmt(lineSum)} does not match subtotal ${fmt(base)}.`,
    });
  }

  if (d.subtotal != null && d.tax != null && d.total != null) {
    const expected = d.subtotal + d.tax;
    if (!close(expected, d.total)) {
      issues.push({
        severity: "error",
        message: `Subtotal ${fmt(d.subtotal)} + tax ${fmt(d.tax)} = ${fmt(expected)}, but total is ${fmt(d.total)}.`,
      });
    }
  }

  return issues;
}
