import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pinpoint",
  description:
    "Runbook retrieval assistant for NOC engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}