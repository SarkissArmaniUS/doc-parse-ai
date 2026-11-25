"use client";

import { useEffect, useRef, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { sampleInvoice, sampleResume } from "@/lib/samples";
import { validateInvoice } from "@/lib/validate";
import type { Invoice, Mode, Resume } from "@/lib/schemas";

type Result = Invoice | Resume;

const MAX = 4 * 1024 * 1024;

const card = "rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgba(27,36,48,0.04),0_8px_24px_-12px_rgba(27,36,48,0.12)]";
const btnGhost =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-medium transition hover:border-ink/30 hover:bg-paper disabled:opacity-50";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[.98] disabled:opacity-50";

type IconProps = { d: string; size?: number };
function Icon({ d, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const I = {
  upload: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  copy: "M9 9h10v10H9zM5 15V5h10",
  check: "M5 12.5l4.5 4.5L19 7.5",
  download: "M12 4v12m0 0 5-5m-5 5-5-5M4 20h16",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  warn: "M12 9v4m0 4h.01M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z",
};

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
    if (file.type !== "application/pdf") return setError("PDF file required.");
    if (file.size > MAX) return setError("File exceeds 4 MB. Please upload a smaller file.");

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
    <section className="mt-10">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Document type" className="inline-flex rounded-xl border border-line bg-card p-1 shadow-sm">
          {(["invoice", "resume"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-lg px-5 py-1.5 text-sm font-medium transition ${
                mode === m ? "bg-ink text-white shadow" : "text-muted hover:text-ink"
              }`}
            >
              {m === "invoice" ? "Invoice" : "Resume"}
            </button>
          ))}
        </div>

        <label className="flex flex-wrap items-center gap-3 text-sm">
          <span className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Icon d={I.lock} size={14} />
            </span>
            <input
              type="password"
              value={key}
              onChange={(e) => updateKey(e.target.value)}
              placeholder="Access key"
              aria-label="Access key"
              autoComplete="off"
              className="w-52 rounded-lg border border-line bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted/70"
            />
          </span>
          <span className="text-xs text-muted">Required for your own files. Sample works without a key.</span>
        </label>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`mt-4 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
          drag ? "scale-[1.01] border-accent bg-accent-soft" : "border-line bg-card/60 hover:border-ink/25"
        }`}
      >
        <span className={`grid h-14 w-14 place-items-center rounded-2xl transition ${drag ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>
          <Icon d={I.upload} size={26} />
        </span>
        <div>
          <p className="text-base font-medium">Drag and drop PDF here</p>
          <p className="mt-1 text-sm text-muted">PDF only · up to 4 MB</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => input.current?.click()} disabled={loading} className={btnPrimary}>
            <Icon d={I.doc} /> Choose file
          </button>
          <button
            onClick={() => { setError(null); setResult(mode === "invoice" ? sampleInvoice : sampleResume); }}
            disabled={loading}
            className={btnGhost}
          >
            <Icon d={I.spark} /> Try with a sample
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

      {/* Status */}
      <div aria-live="polite" className="mt-6 empty:mt-0">
        {loading && <LoadingCard />}
        {error && (
          <p className="fade-up flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="mt-0.5 shrink-0"><Icon d={I.warn} /></span>
            {error}
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="fade-up mt-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Extracted data</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyJson} className={btnGhost}>
                <Icon d={copied ? I.check : I.copy} /> {copied ? "Copied" : "Copy JSON"}
              </button>
              <button onClick={() => downloadCsv(mode, result)} className={btnPrimary}>
                <Icon d={I.download} /> Download CSV
              </button>
            </div>
          </div>
          {mode === "invoice" && <Checks d={result as Invoice} />}
          {mode === "invoice" ? <InvoiceView d={result as Invoice} /> : <ResumeView d={result as Resume} />}
          <details className={`group mt-6 overflow-hidden ${card}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-medium text-muted hover:text-ink">
              Show JSON
              <span className="transition group-open:rotate-180"><Icon d="M6 9l6 6 6-6" /></span>
            </summary>
            <pre className="overflow-x-auto border-t border-line bg-ink p-5 font-mono text-xs leading-relaxed text-emerald-100">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}

function LoadingCard() {
  return (
    <div className={`fade-up p-5 ${card}`}>
      <p className="mb-4 flex items-center gap-2 text-sm text-muted">
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        Reading document…
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
      </div>
      <div className="skeleton mt-5 h-24 rounded-lg" />
    </div>
  );
}

const num = (n: number | null, c?: string | null) =>
  n == null ? "—" : `${n.toLocaleString("en-US")}${c ? " " + c : ""}`;

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 truncate font-medium" title={value ?? undefined}>{value ?? "—"}</dd>
    </div>
  );
}

function InvoiceView({ d }: { d: Invoice }) {
  return (
    <div className={`overflow-hidden ${card}`}>
      <dl className="grid grid-cols-2 gap-5 border-b border-line bg-paper/50 p-5 sm:grid-cols-4">
        <Field label="Vendor" value={d.vendor} />
        <Field label="Number" value={d.invoiceNumber} />
        <Field label="Date" value={d.date} />
        <Field label="Currency" value={d.currency} />
      </dl>
      <div className="overflow-x-auto px-5">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-3 font-medium">Item</th>
              <th className="py-3 text-right font-medium">Qty</th>
              <th className="py-3 text-right font-medium">Price</th>
              <th className="py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px]">
            {d.items.map((i, k) => (
              <tr key={k} className="border-t border-line/70 transition hover:bg-paper/60">
                <td className="py-3 pr-4 font-sans text-sm">{i.description}</td>
                <td className="py-3 text-right">{num(i.quantity)}</td>
                <td className="py-3 text-right">{num(i.unitPrice)}</td>
                <td className="py-3 text-right">{num(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="ml-auto mt-2 w-full max-w-xs space-y-2 p-5 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-mono">{num(d.subtotal, d.currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="font-mono">{num(d.tax, d.currency)}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
          <dt>Total</dt><dd className="font-mono text-accent">{num(d.total, d.currency)}</dd>
        </div>
      </dl>
    </div>
  );
}

function ResumeView({ d }: { d: Resume }) {
  return (
    <div className={`overflow-hidden ${card}`}>
      <dl className="grid grid-cols-2 gap-5 border-b border-line bg-paper/50 p-5 sm:grid-cols-4">
        <Field label="Name" value={d.fullName} />
        <Field label="Email" value={d.email} />
        <Field label="Phone" value={d.phone} />
        <Field label="Location" value={d.location} />
      </dl>
      <div className="space-y-6 p-5">
        {d.summary && <p className="text-sm leading-relaxed text-ink/90">{d.summary}</p>}

        {d.skills.length > 0 && (
          <div>
            <SectionTitle>Skills</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {d.skills.map((s) => (
                <span key={s} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionTitle>Experience</SectionTitle>
          <ul className="space-y-5 border-l border-line pl-5 text-sm">
            {d.experience.map((e, k) => (
              <li key={k} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-accent ring-4 ring-white" />
                <p className="font-medium">{e.title ?? "—"}, {e.company}</p>
                <p className="font-mono text-xs text-muted">{e.start ?? "?"} – {e.end ?? "present"}</p>
                {e.description && <p className="mt-1 text-ink/80">{e.description}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionTitle>Education</SectionTitle>
          <ul className="space-y-1.5 text-sm">
            {d.education.map((e, k) => (
              <li key={k}>{e.school}{e.degree ? `, ${e.degree}` : ""}{e.year ? ` (${e.year})` : ""}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{children}</h3>;
}

function Checks({ d }: { d: Invoice }) {
  const issues = validateInvoice(d);
  if (issues.length === 0) {
    return (
      <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <Icon d={I.check} /> Totals match: line items, tax, and total are consistent.
      </p>
    );
  }
  const hasError = issues.some((i) => i.severity === "error");
  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${hasError ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <p className="flex items-center gap-2 font-medium">
        <Icon d={I.warn} /> {hasError ? "Please verify data manually" : "Warnings found"}
      </p>
      <ul className="mt-1.5 list-disc pl-9">
        {issues.map((i, k) => <li key={k}>{i.message}</li>)}
      </ul>
    </div>
  );
}
