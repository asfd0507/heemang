import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5년 후 나에게",
  description: "타임캡슐 다이어리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
