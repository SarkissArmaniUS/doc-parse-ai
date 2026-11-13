import Parser from "@/components/Parser";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Из PDF в таблицу за секунды</h1>
      <p className="mt-2 max-w-xl text-[var(--muted)]">
        Загрузите счёт или резюме. Получите структурированные данные, JSON для кода и CSV для Excel.
      </p>
      <Parser />
    </main>
  );
}
