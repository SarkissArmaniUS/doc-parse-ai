import Parser from "@/components/Parser";

const steps = [
  { n: "01", t: "Upload", d: "Drop a PDF invoice or resume" },
  { n: "02", t: "Extract", d: "AI reads and structures it" },
  { n: "03", t: "Export", d: "Copy JSON or download CSV" },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M9 13h6M9 17h4" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight">DocParse AI</span>
        </div>
        <span className="rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">Invoices · Resumes</span>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-20 pt-14">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> AI document extraction
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            From PDF to <span className="text-accent">spreadsheet</span> in seconds
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            Upload an invoice or resume. Get structured data, JSON for code, and CSV for Excel.
          </p>
        </div>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="flex items-start gap-3 rounded-xl border border-line bg-card/70 p-4 backdrop-blur">
              <span className="font-mono text-xs text-accent">{s.n}</span>
              <div>
                <p className="text-sm font-medium">{s.t}</p>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <Parser />
      </main>

      <footer className="mx-auto max-w-4xl px-5 pb-10 text-xs text-muted">
        Files are processed to extract data only. Always verify results before use.
      </footer>
    </>
  );
}
