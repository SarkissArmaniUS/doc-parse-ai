import type { Invoice, Resume } from "./schemas";

export const sampleInvoice: Invoice = {
  vendor: "Northwind Design Studio",
  invoiceNumber: "INV-2026-0142",
  date: "2026-10-28",
  currency: "USD",
  items: [
    { description: "Дизайн лендинга", quantity: 1, unitPrice: 1200, total: 1200 },
    { description: "Вёрстка (часы)", quantity: 18, unitPrice: 45, total: 810 },
    { description: "Хостинг, 12 месяцев", quantity: 1, unitPrice: 120, total: 120 },
  ],
  subtotal: 2130,
  tax: 426,
  total: 2556,
};

export const sampleResume: Resume = {
  fullName: "Анна Коваленко",
  email: "anna@example.com",
  phone: "+380 50 000 00 00",
  location: "Полтава, Украина",
  summary: "Full-stack разработчик с 2 годами опыта в React и Node.js.",
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Docker"],
  experience: [
    { company: "WebForge", title: "Junior Developer", start: "2024-03", end: "present", description: "Разработка админ-панелей на React и REST API на Node.js." },
    { company: "Фриланс", title: "Web Developer", start: "2023-01", end: "2024-02", description: "Сайты и боты для малого бизнеса." },
  ],
  education: [{ school: "Полтавский национальный технический университет", degree: "Бакалавр, Информатика", year: "2024" }],
};
