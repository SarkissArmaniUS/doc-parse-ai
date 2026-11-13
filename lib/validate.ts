import type { Invoice } from "./schemas";

export type Issue = { severity: "error" | "warning"; message: string };

const TOL = 0.02;
const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(TOL, Math.abs(b) * 0.001);
const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export function validateInvoice(d: Invoice): Issue[] {
  const issues: Issue[] = [];

  if (d.items.length === 0) {
    issues.push({ severity: "error", message: "Не найдено ни одной позиции." });
  }
  if (d.total == null) {
    issues.push({ severity: "error", message: "Не найдена итоговая сумма." });
  }
  if (!d.vendor) issues.push({ severity: "warning", message: "Не найден поставщик." });
  if (!d.date) issues.push({ severity: "warning", message: "Не найдена дата." });
  if (!d.currency) issues.push({ severity: "warning", message: "Не найдена валюта." });

  d.items.forEach((it, i) => {
    if (it.quantity != null && it.unitPrice != null && it.total != null) {
      const expected = it.quantity * it.unitPrice;
      if (!close(expected, it.total)) {
        issues.push({
          severity: "warning",
          message: `Позиция ${i + 1}: ${it.quantity} × ${fmt(it.unitPrice)} = ${fmt(expected)}, а в счёте ${fmt(it.total)}.`,
        });
      }
    }
  });

  const lineSum = d.items.reduce((s, it) => s + (it.total ?? 0), 0);
  const base = d.subtotal ?? (d.tax == null ? d.total : null);
  if (base != null && d.items.length > 0 && !close(lineSum, base)) {
    issues.push({
      severity: "error",
      message: `Сумма позиций ${fmt(lineSum)} не совпадает с суммой без налога ${fmt(base)}.`,
    });
  }

  if (d.subtotal != null && d.tax != null && d.total != null) {
    const expected = d.subtotal + d.tax;
    if (!close(expected, d.total)) {
      issues.push({
        severity: "error",
        message: `Без налога ${fmt(d.subtotal)} + налог ${fmt(d.tax)} = ${fmt(expected)}, а итого ${fmt(d.total)}.`,
      });
    }
  }

  return issues;
}
