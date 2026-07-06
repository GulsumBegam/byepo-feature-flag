import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Admin | Feature Flag System",
  description: "Super Admin portal for managing organizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="bg-zinc-900 text-white px-6 py-4">
          <h1 className="text-lg font-semibold">
            Feature Flag System — Super Admin
          </h1>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
