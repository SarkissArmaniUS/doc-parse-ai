import type { Invoice, Resume } from "./schemas";

// Built-in samples for the "Try a sample" button: no API calls, no tokens spent.
export const sampleInvoice: Invoice = {
  vendor: "Northwind Design Studio",
  invoiceNumber: "INV-2026-0142",
  date: "2026-10-28",
  currency: "USD",
  items: [
    { description: "Landing page design", quantity: 1, unitPrice: 1200, total: 1200 },
    { description: "Front-end development (hours)", quantity: 18, unitPrice: 45, total: 810 },
    { description: "Hosting, 12 months", quantity: 1, unitPrice: 120, total: 120 },
  ],
  subtotal: 2130,
  tax: 426,
  total: 2556,
};

export const sampleResume: Resume = {
  fullName: "Anna Kovalenko",
  email: "anna@example.com",
  phone: "+380 50 000 00 00",
  location: "Poltava, Ukraine",
  summary: "Full-stack developer with 2 years of experience in React and Node.js.",
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Docker"],
  experience: [
    { company: "WebForge", title: "Junior Developer", start: "2024-03", end: "present", description: "Built admin dashboards in React and REST APIs in Node.js." },
    { company: "Freelance", title: "Web Developer", start: "2023-01", end: "2024-02", description: "Websites and bots for small businesses." },
  ],
  education: [{ school: "Poltava National Technical University", degree: "Bachelor, Computer Science", year: "2024" }],
};
