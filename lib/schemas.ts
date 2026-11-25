import { z } from "zod";

export const invoiceSchema = z.object({
    vendor: z.string().nullable().describe("Vendor name"),
    invoiceNumber: z.string().nullable(),
    date: z.string().nullable().describe("Invoice date in YYYY-MM-DD format"),
    currency: z.string().nullable().describe("Currency code, e.g., USD, EUR, UAH"),
    items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unitPrice: z.number().nullable(),
      total: z.number().nullable(),
    })
  ),
  subtotal: z.number().nullable(),
    tax: z.number().nullable().describe("VAT/tax amount"),
    total: z.number().nullable(),
});

export const resumeSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
    summary: z.string().nullable().describe("Brief candidate summary, 1-2 sentences"),
    skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string().nullable(),
      start: z.string().nullable(),
        end: z.string().nullable().describe("null or 'present' if currently working there"),
        description: z.string().nullable(),
    })
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().nullable(),
      year: z.string().nullable(),
    })
  ),
});

export type Mode = "invoice" | "resume";
export type Invoice = z.infer<typeof invoiceSchema>;
export type Resume = z.infer<typeof resumeSchema>;

export const schemas = { invoice: invoiceSchema, resume: resumeSchema } as const;

export const prompts: Record<Mode, string> = {
  invoice:
      "Extract data from this invoice. If a field is missing from the document, set it to null. Do not hallucinate or invent anything. Return numbers without currency symbols.",
    resume:
        "Extract data from this resume. If a field is missing from the document, set it to null. Do not hallucinate or invent anything. Return skills as separate short strings.",
};
