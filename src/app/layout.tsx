
import type { Metadata } from "next";
import "./globals.css";
import { Atma, Lilita_One } from "next/font/google";
import type { ReactNode } from "react";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const atma = Atma({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-atma" });
const lilita = Lilita_One({ subsets: ["latin"], weight: ["400"], variable: "--font-lilita" });

export const metadata: Metadata = {
  title: "Maiztros POS",
  description: "POS + KDS + Tracking",
  manifest: "/manifest.json",
  themeColor: "#FF7A00",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${atma.variable} ${lilita.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <ServiceWorkerRegister />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
