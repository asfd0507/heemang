import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/common/Navbar";
import { KakaoScript } from "@/components/common/KakaoScript";

export const metadata: Metadata = {
  title: "미래의 조각",
  description: "타임캡슐 다이어리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased bg-white">
        <Navbar />
        {children}
        <KakaoScript />
      </body>
    </html>
  );
}
