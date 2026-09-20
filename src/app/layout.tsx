import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaterialsAI — AI-Assisted Engineering Material Selection Tool",
  description:
    "An end-to-end AI decision-support tool translating natural-language design specifications into quantitative engineering constraints, Ashby performance ranking, and zero-fabrication rationale synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
