import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SecureNet",
    template: "%s | SecureNet",
  },
  description:
    "SecureNet is a simulated network monitoring center built for demonstration and learning.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#071018",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
