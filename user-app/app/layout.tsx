import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Check Feature Status",
  description: "Check whether a feature is enabled for your organization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-zinc-100">
        {children}
      </body>
    </html>
  );
}
