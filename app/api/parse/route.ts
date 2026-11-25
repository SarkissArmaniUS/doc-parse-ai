import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { extract, isBusy } from "@/lib/extract";
import { allow } from "@/lib/ratelimit";
import type { Mode } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel request body limit is ~4.5 MB

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!(await allow(ip))) {
    return NextResponse.json(
        { error: "Rate limit exceeded. Try again later or click \"Try with a sample\"." },
        { status: 429 }
    );
  }

  if (!hasAccess(req)) {
    return NextResponse.json(
        { error: "Access key required. Only the sample is available without a key." },
        { status: 401 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const mode = form.get("mode") as Mode | null;

  if (!(file instanceof File) || (mode !== "invoice" && mode !== "resume")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF file required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 4 MB." }, { status: 413 });
  }

  try {
    const { data } = await extract(mode, new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json({ data });
  }  catch (err) {
  console.error(err);
  if (isBusy(err)) {
    return NextResponse.json(
        { error: "Google model is currently overloaded. Try again in a minute."},
        { status: 503 }
    );
  }
    return NextResponse.json({error: "Failed to process document."}, { status: 500 });
  }
}
