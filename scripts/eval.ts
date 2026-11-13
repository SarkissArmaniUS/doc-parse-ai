/**
 * Evals: compares model output with hand-labeled ground truth.
 *
 * Put pairs of files in evals/cases:  name.pdf  +  name.json
 * name.json format: { "mode": "invoice" | "resume", "expected": { ...matching the schema... } }
 *
 * Run:  npm run eval            (all cases)
 *       npm run eval -- name    (only cases whose name contains "name")
 * Output: a table in the console and the file evals/results.md
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extract } from "../lib/extract";
import type { Invoice, Mode, Resume } from "../lib/schemas";
import { validateInvoice } from "../lib/validate";

type Case = { mode: Mode; expected: Invoice | Resume };
type Tally = Record<string, { ok: number; total: number }>;

const DIR = join(process.cwd(), "evals", "cases");
const filter = process.argv[2];

const norm = (s: unknown) =>
  String(s ?? "").toLowerCase().replace(/\s+/g, " ").replace(/[.,;:]+$/g, "").trim();

function same(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 0.01;
  return norm(a) === norm(b);
}

/** Descriptions need not match word for word: one containing the other is enough. */
function fuzzy(a: unknown, b: unknown): boolean {
  const x = norm(a), y = norm(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
}

function record(t: Tally, field: string, ok: boolean) {
  t[field] ??= { ok: 0, total: 0 };
  t[field].total++;
  if (ok) t[field].ok++;
}

function scoreInvoice(t: Tally, got: Invoice, exp: Invoice) {
  for (const f of ["vendor", "invoiceNumber", "date", "currency", "subtotal", "tax", "total"] as const) {
    record(t, f, same(got[f], exp[f]));
  }
  record(t, "items.count", got.items.length === exp.items.length);
  exp.items.forEach((e, i) => {
    const g = got.items[i];
    record(t, "items.description", !!g && fuzzy(g.description, e.description));
    record(t, "items.quantity", !!g && same(g.quantity, e.quantity));
    record(t, "items.unitPrice", !!g && same(g.unitPrice, e.unitPrice));
    record(t, "items.total", !!g && same(g.total, e.total));
  });
}

function scoreResume(t: Tally, got: Resume, exp: Resume) {
  for (const f of ["fullName", "email", "phone", "location"] as const) {
    record(t, f, same(got[f], exp[f]));
  }
  const have = new Set(got.skills.map(norm));
  exp.skills.forEach((s) => record(t, "skills (recall)", have.has(norm(s))));
  record(t, "experience.count", got.experience.length === exp.experience.length);
  exp.experience.forEach((e, i) => {
    const g = got.experience[i];
    record(t, "experience.company", !!g && fuzzy(g.company, e.company));
    record(t, "experience.title", !!g && fuzzy(g.title, e.title));
  });
  record(t, "education.count", got.education.length === exp.education.length);
}

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is missing. Run via `npm run eval` (it loads .env.local).");
    process.exit(1);
  }

  const names = readdirSync(DIR)
    .filter((f) => f.endsWith(".pdf") && !f.startsWith("_"))
    .map((f) => f.replace(/\.pdf$/, ""))
    .filter((n) => !filter || n.includes(filter));

  if (names.length === 0) {
    console.error(`No name.pdf + name.json pairs found in ${DIR}.`);
    process.exit(1);
  }

  const tally: Record<Mode, Tally> = { invoice: {}, resume: {} };
  const rows: string[] = [];
  let inTok = 0, outTok = 0, flagged = 0, failed = 0, invoiceCount = 0, correctlyFlagged = 0;
  const started = Date.now();

  for (const name of names) {
    const spec: Case = JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8"));
    const pdf = new Uint8Array(readFileSync(join(DIR, `${name}.pdf`)));
    const t0 = Date.now();
    await new Promise((r) => setTimeout(r, 6000)); // free tier: requests-per-minute limit
    try {
      const { data, usage } = await extract(spec.mode, pdf);
      inTok += usage.inputTokens ?? 0;
      outTok += usage.outputTokens ?? 0;
      const before = Object.values(tally[spec.mode]).reduce((s, v) => s + v.ok, 0);
      const beforeTotal = Object.values(tally[spec.mode]).reduce((s, v) => s + v.total, 0);

      if (spec.mode === "invoice") {
        scoreInvoice(tally.invoice, data as Invoice, spec.expected as Invoice);
        invoiceCount++;
        const issues = validateInvoice(data as Invoice);
        const hasError = issues.some((i) => i.severity === "error");
        if (hasError) flagged++;
        // The check is useful if it flags wrong answers and leaves correct ones alone
        const afterOk = Object.values(tally.invoice).reduce((s, v) => s + v.ok, 0);
        const afterTotal = Object.values(tally.invoice).reduce((s, v) => s + v.total, 0);
        const perfect = afterOk - before === afterTotal - beforeTotal;
        if (hasError !== perfect) correctlyFlagged++;
      } else {
        scoreResume(tally.resume, data as Resume, spec.expected as Resume);
      }
      rows.push(`${name}: ok (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    } catch (e) {
      failed++;
      rows.push(`${name}: ERROR ${(e as Error).message}`);
    }
  }

  const lines: string[] = [];
  lines.push(`# Eval results`, "", `Files: ${names.length}, failed calls: ${failed}, models: ${process.env.GEMINI_MODELS ?? "gemini-flash-latest,gemini-flash-lite-latest"}`, "");

  for (const mode of ["invoice", "resume"] as Mode[]) {
    const t = tally[mode];
    const fields = Object.entries(t);
    if (fields.length === 0) continue;
    const ok = fields.reduce((s, [, v]) => s + v.ok, 0);
    const total = fields.reduce((s, [, v]) => s + v.total, 0);
    lines.push(`## ${mode === "invoice" ? "Invoices" : "Résumés"}: overall accuracy ${((ok / total) * 100).toFixed(1)}%`, "");
    lines.push("| Field | Correct | Total | Accuracy |", "|---|---|---|---|");
    for (const [f, v] of fields) {
      lines.push(`| ${f} | ${v.ok} | ${v.total} | ${((v.ok / v.total) * 100).toFixed(0)}% |`);
    }
    lines.push("");
  }

  if (invoiceCount > 0) {
    lines.push(
      `The arithmetic check flagged ${flagged} of ${invoiceCount} invoices; its verdict was right (error caught or none present) for ${correctlyFlagged} of ${invoiceCount}.`,
      ""
    );
  }
  lines.push(`Tokens: ${inTok} in, ${outTok} out. Time: ${((Date.now() - started) / 1000).toFixed(0)} s.`, "", "```", ...rows, "```", "");

  const report = lines.join("\n");
  console.log(report);
  writeFileSync(join(process.cwd(), "evals", "results.md"), report);
}

main();
