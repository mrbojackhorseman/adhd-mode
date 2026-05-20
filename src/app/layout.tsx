import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADHD Mode",
  description: "7 executive function tools to shatter paralysis and get work done",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
