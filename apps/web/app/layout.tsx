import type { Metadata, Viewport } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { SessionProvider } from "@/lib/session";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Kinship — graph-based kinship verification",
  description:
    "Register people, map family relationships as a graph, and verify marriage eligibility with an explainable relationship path.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Kinship — graph-based kinship verification",
    description:
      "Register people, map family relationships as a graph, and verify marriage eligibility with an explainable relationship path.",
  },
};

export const viewport: Viewport = {
  themeColor: "#251216",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Warm the font origins before the render-blocking CSS requests them. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
