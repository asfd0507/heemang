"use client";

import { useState } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday,
  isBefore,
  startOfToday
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 더미 데이터: 답변이 완료된 날짜들
const dummyCompletedDates = [
  new Date(2026, 4, 1),
  new Date(2026, 4, 2),
  new Date(2026, 4, 4),
  new Date(2026, 4, 5),
  new Date(2026, 4, 6),
  new Date(2026, 4, 7),
];

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 8)); // 2026년 5월 기준

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-6">
      <div className="mac-card p-6 md:p-8 space-y-8">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1D1D1F]">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h2>
          <div className="flex bg-[#E8E8ED] rounded-lg p-0.5">
            <button 
              onClick={prevMonth} 
              className="p-1.5 hover:bg-white rounded-md transition-all active:scale-90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={nextMonth} 
              className="p-1.5 hover:bg-white rounded-md transition-all active:scale-90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-[#D2D2D7]/30 pb-4">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="text-center text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-[#D2D2D7]/30 border border-[#D2D2D7]/30 rounded-xl overflow-hidden shadow-inner">
          {days.map((day, idx) => {
            const isCompleted = dummyCompletedDates.some(d => isSameDay(d, day));
            const isCurrentToday = isToday(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isPast = isBefore(day, startOfToday()) && !isCompleted;

            return (
              <div
                key={day.toString()}
                className={cn(
                  "relative aspect-square bg-white flex flex-col items-center justify-center transition-all duration-200",
                  !isCurrentMonth && "bg-[#F5F5F7] opacity-40",
                  isCurrentMonth && "hover:bg-[#F5F5F7] cursor-pointer group"
                )}
              >
                {/* 날짜 숫자 */}
                <span className={cn(
                  "text-[13px] font-medium z-10 mb-1",
                  isCurrentToday ? "text-[#007AFF] font-bold" : "text-[#1D1D1F]"
                )}>
                  {format(day, "d")}
                </span>

                {/* 상태 표시 */}
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-300",
                  isCompleted && "bg-[#007AFF] scale-125 shadow-[0_0_8px_rgba(0,122,255,0.5)]",
                  isCurrentToday && !isCompleted && "bg-[#D2D2D7] animate-pulse",
                  isPast && isCurrentMonth && "bg-[#D2D2D7]/50",
                  !isCompleted && !isCurrentToday && !isPast && "bg-transparent group-hover:bg-[#D2D2D7]/30"
                )} />

                {/* 오늘 테두리 표시 */}
                {isCurrentToday && (
                  <div className="absolute inset-1 rounded-lg border-2 border-[#007AFF]/20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-[11px] font-medium text-[#86868B]">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#007AFF]" />
          답변 완료
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#D2D2D7] animate-pulse" />
          오늘 질문
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#D2D2D7]/50" />
          스킵됨
        </div>
      </div>
    </div>
  );
}

// Wrap for the page
export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <nav className="fixed top-0 left-0 right-0 h-12 bg-white/70 backdrop-blur-md border-b border-[#D2D2D7]/30 z-50">
        <div className="container mx-auto max-w-screen-md h-full px-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-bold tracking-tight text-[#1D1D1F]">5년 후 나에게</Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              대시보드
            </Link>
            <Link href="/history" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors flex items-center gap-1">
              <History className="h-3.5 w-3.5" />
              아카이브
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-screen-md px-4 pt-24 pb-20 space-y-8 animate-in fade-in duration-700">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">기록 달력</h1>
          <p className="text-sm text-[#86868B]">당신의 소중한 기록들을 한눈에 확인하세요.</p>
        </header>
        
        <CalendarView />
      </main>
    </div>
  );
}
