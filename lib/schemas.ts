import { z } from "zod";

export const invoiceSchema = z.object({
  vendor: z.string().nullable().describe("Название поставщика"),
  invoiceNumber: z.string().nullable(),
  date: z.string().nullable().describe("Дата счёта в формате YYYY-MM-DD"),
  currency: z.string().nullable().describe("Код валюты, например USD, EUR, UAH"),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unitPrice: z.number().nullable(),
      total: z.number().nullable(),
    })
  ),
  subtotal: z.number().nullable(),
  tax: z.number().nullable().describe("Сумма НДС/налога"),
  total: z.number().nullable(),
});

export const resumeSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  summary: z.string().nullable().describe("Краткое описание кандидата, 1-2 предложения"),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable().describe("null или 'present', если работает сейчас"),
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
    "Извлеки данные из этого счёта. Если поля нет в документе, ставь null. Ничего не выдумывай. Числа без символов валюты.",
  resume:
    "Извлеки данные из этого резюме. Если поля нет в документе, ставь null. Ничего не выдумывай. Навыки верни отдельными короткими строками.",
};
