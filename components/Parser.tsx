"use client";

import { useEffect, useRef, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { sampleInvoice, sampleResume } from "@/lib/samples";
import { validateInvoice } from "@/lib/validate";
import type { Invoice, Mode, Resume } from "@/lib/schemas";

type Result = Invoice | Resume;

const MAX = 4 * 1024 * 1024;

export default function Parser() {
  const [mode, setMode] = useState<Mode>("invoice");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState("");

  useEffect(() => {
    setKey(sessionStorage.getItem("access-key") ?? "");
  }, []);

  function updateKey(v: string) {
    setKey(v);
    sessionStorage.setItem("access-key", v);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setResult(null);
    setError(null);
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    if (file.type !== "application/pdf") return setError("A PDF file is required.");
    if (file.size > MAX) return setError("File is larger than 4 MB. Please upload a smaller file.");

    setLoading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("mode", mode);
      const res = await fetch("/api/parse", { method: "POST", body, headers: { "x-access-key": key } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Server error.");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="mt-8">
      <div role="tablist" className="inline-flex rounded-md border border-[var(--line)] bg-white p-1">
        {(["invoice", "resume"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded px-4 py-1.5 text-sm font-medium ${
              mode === m ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
            }`}
          >
            {m === "invoice" ? "Invoice" : "Résumé"}
          </button>
        ))}
      </div>

      <label className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">Access key</span>
        <input
          type="password"
          value={key}
          onChange={(e) => updateKey(e.target.value)}
          placeholder="Required for your own files"
          autoComplete="off"
          className="w-64 rounded-md border border-[var(--line)] bg-white px-3 py-1.5"
        />
        <span className="text-[var(--muted)]">The sample works without a key</span>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`mt-3 flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center ${
          drag ? "border-[var(--accent)] bg-white" : "border-[var(--line)]"
        }`}
      >
        <p className="font-medium">Drop a PDF here</p>
        <p className="text-sm text-[var(--muted)]">up to 4 MB</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => input.current?.click()}
            disabled={loading}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Choose file
          </button>
          <button
            onClick={() => { setError(null); setResult(mode === "invoice" ? sampleInvoice : sampleResume); }}
            disabled={loading}
            className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Try a sample
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>

      <div aria-live="polite" className="mt-6">
        {loading && <p className="text-[var(--muted)]">Reading the document…</p>}
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      </div>

      {result && (
        <div className="mt-2">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={copyJson} className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium">
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button onClick={() => downloadCsv(mode, result)} className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium">
              Download CSV
            </button>
          </div>
          {mode === "invoice" && <Checks d={result as Invoice} />}
          {mode === "invoice" ? <InvoiceView d={result as Invoice} /> : <ResumeView d={result as Resume} />}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-[var(--muted)]">Show JSON</summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-white p-4 text-xs">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}

const num = (n: number | null, c?: string | null) =>
  n == null ? "—" : `${n.toLocaleString("en-US")}${c ? " " + c : ""}`;

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function InvoiceView({ d }: { d: Invoice }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Vendor" value={d.vendor} />
        <Field label="Number" value={d.invoiceNumber} />
        <Field label="Date" value={d.date} />
        <Field label="Currency" value={d.currency} />
      </dl>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--muted)]">
            <tr>
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((i, k) => (
              <tr key={k} className="border-b border-[var(--line)]/60">
                <td className="py-2">{i.description}</td>
                <td className="py-2 text-right">{num(i.quantity)}</td>
                <td className="py-2 text-right">{num(i.unitPrice)}</td>
                <td className="py-2 text-right">{num(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-[var(--muted)]">Subtotal</dt><dd>{num(d.subtotal, d.currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-[var(--muted)]">Tax</dt><dd>{num(d.tax, d.currency)}</dd></div>
        <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{num(d.total, d.currency)}</dd></div>
      </dl>
    </div>
  );
}

function ResumeView({ d }: { d: Resume }) {
  return (
    <div className="space-y-5 rounded-lg border border-[var(--line)] bg-white p-5">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Name" value={d.fullName} />
        <Field label="Email" value={d.email} />
        <Field label="Phone" value={d.phone} />
        <Field label="Location" value={d.location} />
      </dl>
      {d.summary && <p className="text-sm">{d.summary}</p>}
      <div className="flex flex-wrap gap-2">
        {d.skills.map((s) => (
          <span key={s} className="rounded-full bg-[var(--paper)] px-3 py-1 text-sm">{s}</span>
        ))}
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Experience</h2>
        <ul className="space-y-3 text-sm">
          {d.experience.map((e, k) => (
            <li key={k}>
              <p className="font-medium">{e.title ?? "—"}, {e.company}</p>
              <p className="text-[var(--muted)]">{e.start ?? "?"} – {e.end ?? "present"}</p>
              {e.description && <p>{e.description}</p>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Education</h2>
        <ul className="space-y-1 text-sm">
          {d.education.map((e, k) => (
            <li key={k}>{e.school}{e.degree ? `, ${e.degree}` : ""}{e.year ? ` (${e.year})` : ""}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Checks({ d }: { d: Invoice }) {
  const issues = validateInvoice(d);
  if (issues.length === 0) {
    return (
      <p className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Totals check out: line items, tax, and total all match.
      </p>
    );
  }
  const hasError = issues.some((i) => i.severity === "error");
  return (
    <div className={`mb-4 rounded-md px-4 py-3 text-sm ${hasError ? "bg-red-50 text-red-900" : "bg-amber-50 text-amber-900"}`}>
      <p className="font-medium">{hasError ? "Please review the data manually" : "There are some warnings"}</p>
      <ul className="mt-1 list-disc pl-5">
        {issues.map((i, k) => <li key={k}>{i.message}</li>)}
      </ul>
    </div>
  );
}
