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
    <div className="min-h-screen bg-white pb-32 pt-28">
      <main className="container mx-auto max-w-screen-md px-4 space-y-16 animate-in fade-in duration-1000">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[#3A7BD5] text-[10px] font-black uppercase tracking-widest border border-[#3A7BD5]/10">Archive</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#2C2C2E]">당신이 가장 행복했던 순간은?</h1>
          <p className="text-base text-[#8E8E93] font-bold tracking-tight">매년 같은 날 당신이 남긴 소중한 조각들입니다.</p>
        </header>

        <div className="space-y-12 relative">
          {/* Timeline - Simple Binding Line Style */}
          <div className="absolute left-[1.35rem] top-2 bottom-0 w-[2px] bg-[#E5E5E1]" />

          {historyData.map((item) => (
            <div key={item.year} className="relative pl-12 group">
              {/* Timeline Node - Simple Ink Dot Style */}
              <div className={cn(
                "absolute left-[1.05rem] top-2 h-3 w-3 rounded-full ring-[6px] ring-white z-20 transition-all duration-500 flex items-center justify-center",
                item.status === "completed" 
                  ? "bg-[#3A7BD5]" 
                  : "bg-white border-2 border-[#E5E5E1]"
              )}>
                {item.status === "completed" && <div className="w-1 h-1 bg-white rounded-full" />}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xl font-black tracking-tighter transition-colors",
                    item.status === "completed" ? "text-[#2C2C2E]" : "text-[#8E8E93]"
                  )}>{item.year}년</span>
                  <div className="h-px w-8 bg-[#E5E5E1]" />
                  <span className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest">{item.date}</span>
                </div>

                <div className={cn(
                  "transition-all duration-700 rounded-[2.5rem] overflow-hidden",
                  item.status === "completed" 
                    ? "bg-white p-10 shadow-sm border border-[#E5E5E1] group-hover:shadow-md group-hover:border-[#3A7BD5]/20" 
                    : "bg-[#FAFAF9] p-1 border-none"
                )}>
                  {item.status === "completed" ? (
                    <p className="text-lg leading-[2] text-[#2C2C2E] font-medium tracking-tight">
                      {item.answer}
                    </p>
                  ) : (
                    <div className="p-12 rounded-[2.5rem] border-2 border-dashed border-[#E5E5E1] flex flex-col items-center justify-center text-center space-y-6 bg-white/40">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E5E1] flex items-center justify-center text-[#8E8E93]/40">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-[#8E8E93] font-bold tracking-tight">
                          올해의 답변을 완료해야<br />지난 조각들을 마주할 수 있습니다.
                        </p>
                      </div>
                      <Link href="/dashboard">
                        <Button className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white h-11 px-8 rounded-xl text-xs font-black gap-2 shadow-lg shadow-[#3A7BD5]/10 transition-all border-none">
                          기록하러 가기
                          <ArrowUpRight className="h-3.5 w-3.5" />
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
