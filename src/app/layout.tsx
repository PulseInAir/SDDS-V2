import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDDS",
  description: "Private ITR practice-management operating system for SDDS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
