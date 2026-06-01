import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Rivalo",
    template: "%s | Rivalo",
  },
  description:
    "Rivalo è l'app sportiva per creare match, tornei, gruppi, classifiche e rivalità tra amici.",
  applicationName: "Rivalo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Rivalo",
    statusBarStyle: "black-translucent",
  },
  icons: {
  icon: [
    {
      url: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  apple: "/apple-touch-icon.png",
},
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={orbitron.className}>{children}</body>
    </html>
  );
}