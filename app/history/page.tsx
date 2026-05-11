"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ArrowUpRight, Calendar, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const historyData = [
  {
    year: 2026,
    status: "completed",
    answer: "오늘은 날씨가 너무 좋아서 근처 공원을 산책했어요. 초록색 잎들을 보니 마음이 평온해지네요. 이런 소소한 행복이 계속되었으면 좋겠습니다.",
    date: "2026년 5월 8일"
  },
  {
    year: 2025,
    status: "completed",
    answer: "작년에는 회사 일이 너무 바빠서 정신이 없었네요. 그래도 프로젝트를 성공적으로 마쳐서 뿌듯합니다. 나 자신 수고했다!",
    date: "2025년 5월 8일"
  },
  {
    year: 2024,
    status: "locked",
    answer: null,
    date: "2024년 5월 8일"
  },
  {
    year: 2023,
    status: "locked",
    answer: null,
    date: "2023년 5월 8일"
  }
];

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-32">
      <nav className="fixed top-0 left-0 right-0 h-12 bg-white/70 backdrop-blur-md border-b border-[#D2D2D7]/30 z-50">
        <div className="container mx-auto max-w-screen-md h-full px-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-bold tracking-tight text-[#1D1D1F]">5년 후 나에게</Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors flex items-center gap-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              대시보드
            </Link>
            <Link href="/calendar" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              달력
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-screen-md px-4 pt-24 space-y-12 animate-in fade-in duration-700">
        <header className="space-y-2">
          <p className="text-[10px] font-bold tracking-widest text-[#007AFF] uppercase">Archive</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">당신이 가장 행복했던 순간은?</h1>
          <p className="text-sm text-[#86868B]">매년 같은 날 당신이 남긴 기록들입니다.</p>
        </header>

        <div className="space-y-6 relative">
          {/* Vertical line decoration */}
          <div className="absolute left-[1.35rem] top-0 bottom-0 w-px bg-[#D2D2D7]/50" />

          {historyData.map((item) => (
            <div key={item.year} className="relative pl-10 group">
              {/* Node dot */}
              <div className={cn(
                "absolute left-5 top-1.5 h-1.5 w-1.5 rounded-full ring-4 ring-[#F5F5F7] z-10",
                item.status === "completed" ? "bg-[#007AFF]" : "bg-[#D2D2D7]"
              )} />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#1D1D1F] tracking-tight">{item.year}년</span>
                  <span className="text-[11px] font-medium text-[#86868B]">{item.date}</span>
                  {item.status === "locked" && <Lock className="h-3 w-3 text-[#D2D2D7]" />}
                </div>

                <div className={cn(
                  "mac-card overflow-hidden transition-all duration-300",
                  item.status === "completed" ? "p-8" : "p-1 bg-[#F5F5F7]/30"
                )}>
                  {item.status === "completed" ? (
                    <p className="text-base leading-relaxed text-[#1D1D1F]">
                      {item.answer}
                    </p>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <p className="text-sm text-[#86868B] max-w-[200px]">
                        올해의 답변을 완료해야 작년의 기록을 볼 수 있습니다.
                      </p>
                      <Link href="/dashboard">
                        <Button className="mac-button-primary h-10 px-6 text-xs gap-2">
                          답변 남기기
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
