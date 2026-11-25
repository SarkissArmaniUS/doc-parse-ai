import Parser from "@/components/Parser";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">From PDF to spreadsheet in seconds</h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
            Upload an invoice or resume. Get structured data, JSON for code, and CSV for Excel.
        </p>
      <Parser />
    </main>
  );
}
