import type { Metadata } from "next";
import "./globals.css";

import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Rivalo",
  description: "La rivalità sportiva inizia qui.",
  manifest: "/manifest.json",
themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={orbitron.className}>
        {children}
      </body>
    </html>
  );
}
