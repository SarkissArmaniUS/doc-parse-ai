import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DocParse AI",
  description: "Загрузите счёт или резюме и получите структурированный JSON и CSV.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
