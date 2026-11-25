import type { Invoice } from "./schemas";

export type Issue = { severity: "error" | "warning"; message: string };

const TOL = 0.02; // rounding tolerance
const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(TOL, Math.abs(b) * 0.001);
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/**
 * Checks the invoice arithmetic. The model can misread a table,
 * so the numbers are recomputed in code instead of being trusted.
 */
export function validateInvoice(d: Invoice): Issue[] {
  const issues: Issue[] = [];

  if (d.items.length === 0) {
    issues.push({ severity: "error", message: "No line items found." });
  }
  if (d.total == null) {
    issues.push({ severity: "error", message: "Grand total not found." });
  }
  if (!d.vendor) issues.push({ severity: "warning", message: "Vendor not found." });
  if (!d.date) issues.push({ severity: "warning", message: "Date not found." });
  if (!d.currency) issues.push({ severity: "warning", message: "Currency not found." });

  // 1. quantity x unit price = line total
  d.items.forEach((it, i) => {
    if (it.quantity != null && it.unitPrice != null && it.total != null) {
      const expected = it.quantity * it.unitPrice;
      if (!close(expected, it.total)) {
        issues.push({
          severity: "warning",
          message: `Item ${i + 1}: ${it.quantity} × ${fmt(it.unitPrice)} = ${fmt(expected)}, but the invoice says ${fmt(it.total)}.`,
        });
      }
    }
  });

  // 2. sum of line items = subtotal (or total, if there is no subtotal and no tax)
  const lineSum = d.items.reduce((s, it) => s + (it.total ?? 0), 0);
  const base = d.subtotal ?? (d.tax == null ? d.total : null);
  if (base != null && d.items.length > 0 && !close(lineSum, base)) {
    issues.push({
      severity: "error",
      message: `Sum of line items ${fmt(lineSum)} does not match the subtotal ${fmt(base)}.`,
    });
  }

  // 3. subtotal + tax = total
  if (d.subtotal != null && d.tax != null && d.total != null) {
    const expected = d.subtotal + d.tax;
    if (!close(expected, d.total)) {
      issues.push({
        severity: "error",
        message: `Subtotal ${fmt(d.subtotal)} + tax ${fmt(d.tax)} = ${fmt(expected)}, but the total is ${fmt(d.total)}.`,
      });
    }
  }

  return issues;
}
