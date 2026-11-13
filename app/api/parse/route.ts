import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { extract, isBusy } from "@/lib/extract";
import { allow } from "@/lib/ratelimit";
import type { Mode } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // лимит тела запроса на Vercel ~4.5 МБ

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!(await allow(ip))) {
    return NextResponse.json(
      { error: "Лимит запросов исчерпан. Попробуйте позже или нажмите «Попробовать на примере»." },
      { status: 429 }
    );
  }

  if (!hasAccess(req)) {
    return NextResponse.json(
      { error: "Нужен ключ доступа. Без ключа доступен только пример." },
      { status: 401 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const mode = form.get("mode") as Mode | null;

  if (!(file instanceof File) || (mode !== "invoice" && mode !== "resume")) {
    return NextResponse.json({ error: "Неверный запрос." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Нужен PDF-файл." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 4 МБ." }, { status: 413 });
  }

  try {
    const { data } = await extract(mode, new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json({ data });
  }  catch (err) {
  console.error(err);
  if (isBusy(err)) {
    return NextResponse.json(
        { error: "Модель Google сейчас перегружена. Попробуйте через минуту." },
        { status: 503 }
    );
  }
  return NextResponse.json({ error: "Не удалось обработать документ." }, { status: 500 });
}
}
