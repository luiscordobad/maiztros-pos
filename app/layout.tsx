
import "./../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Maiztros POS",
  description: "POS + KDS + Tracking",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
