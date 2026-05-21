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
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-10">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-[#E5E5E1] space-y-10">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#2C2C2E] tracking-tighter">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h2>
          <div className="flex bg-[#F5F5F7] border border-[#E5E5E1] rounded-2xl p-1 items-center gap-1 shadow-inner">
            <button 
              onClick={prevMonth} 
              className="p-2 hover:bg-white rounded-xl transition-all active:scale-90 text-[#8E8E93] hover:text-[#2C2C2E]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={nextMonth} 
              className="p-2 hover:bg-white rounded-xl transition-all active:scale-90 text-[#8E8E93] hover:text-[#2C2C2E]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-[#E5E5E1] pb-6">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
            <div key={day} className={cn(
              "text-center text-[12px] font-black uppercase tracking-widest",
              idx === 0 ? "text-[#FF6B6B]" : idx === 6 ? "text-[#3A7BD5]" : "text-[#8E8E93]"
            )}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2 relative">
          {days.map((day) => {
            const isCompleted = dummyCompletedDates.some(d => isSameDay(d, day));
            const isCurrentToday = isToday(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isPast = isBefore(day, startOfToday()) && !isCompleted;

            return (
              <div
                key={day.toString()}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center p-1 transition-all duration-500 cursor-pointer group rounded-full",
                  isCurrentMonth ? "bg-transparent" : "opacity-0 pointer-events-none",
                  isCurrentMonth && "hover:bg-[#3A7BD5]/5"
                )}
              >
                {/* 날짜 숫자 */}
                <span className={cn(
                  "text-[13px] font-black z-10 relative mb-1 transition-colors",
                  isCurrentToday ? "text-[#3A7BD5]" : isCurrentMonth ? "text-[#2C2C2E]/40 group-hover:text-[#2C2C2E]" : "text-transparent"
                )}>
                  {format(day, "d")}
                </span>

                {/* 상태 표시 */}
                <div className="h-10 w-10 flex items-center justify-center relative z-10">
                  {isCompleted ? (
                    <div className="h-full w-full rounded-2xl bg-white border border-[#3A7BD5]/20 flex items-center justify-center text-[#3A7BD5] animate-in zoom-in duration-500 shadow-sm">
                      <Check className="h-5 w-5 stroke-[3px]" />
                    </div>
                  ) : isCurrentToday && !isCompleted ? (
                    <div className="h-full w-full rounded-2xl bg-[#3A7BD5]/5 border border-[#3A7BD5]/30 border-dashed flex items-center justify-center text-[#3A7BD5] animate-pulse">
                      <Sparkles className="h-5 w-5 fill-[#3A7BD5]/10" />
                    </div>
                  ) : isPast && isCurrentMonth ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]/20" />
                  ) : null}
                </div>

                {/* 오늘 테두리 표시 */}
                {isCurrentToday && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-[#3A7BD5] rounded-full z-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-10 text-[11px] font-black text-[#8E8E93] uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg border border-[#3A7BD5]/20 flex items-center justify-center text-[#3A7BD5] bg-white">
            <Check className="h-3 w-3 stroke-[3px]" />
          </div>
          남겨진 조각
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg border border-[#3A7BD5]/30 border-dashed bg-[#3A7BD5]/5 flex items-center justify-center text-[#3A7BD5]">
            <Sparkles className="h-3 w-3 fill-[#3A7BD5]/10" />
          </div>
          오늘의 자리
        </div>
      </div>
    </div>
  );
}

// Wrap for the page
export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20">
      <main className="container mx-auto max-w-screen-md px-4 space-y-12 animate-in fade-in duration-1000">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[#3A7BD5] text-[10px] font-black uppercase tracking-widest border border-[#3A7BD5]/10">Calendar</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#2C2C2E]">기록 달력</h1>
          <p className="text-base text-[#8E8E93] font-bold tracking-tight">당신의 소중한 조각들을 한눈에 확인하세요.</p>
        </header>
        
        <CalendarView />
      </main>
    </div>
  );
}
