import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rivalo",
  description: "La rivalità sportiva inizia qui."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
