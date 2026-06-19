import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARY for ARY",
  description: "ARY GRS 001 full-stack demo with real auth, SQLite and Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      style={
        {
          "--font-body": "Arial, Helvetica, sans-serif",
          "--font-display": "Arial, Helvetica, sans-serif",
        } as React.CSSProperties
      }
    >
      <body>{children}</body>
    </html>
  );
}
