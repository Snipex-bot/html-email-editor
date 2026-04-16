import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HTML Email Editor",
  description: "Visual HTML email template editor with live preview",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="h-full">
      <body className={`${inter.className} h-full bg-gray-950`}>{children}</body>
    </html>
  );
}
