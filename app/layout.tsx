import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssureAudit Planning",
  description: "A connected, data-driven audit planning workspace for ingestion, materiality, risk assessment and approval.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
