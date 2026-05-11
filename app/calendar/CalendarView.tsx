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
  addDays, 
  eachDayOfInterval,
  isToday,
  isBefore,
  startOfToday
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <Card className="p-6 shadow-xl border-none bg-white/80 backdrop-blur-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 mb-4">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {days.map((day, idx) => {
          const isCompleted = dummyCompletedDates.some(d => isSameDay(d, day));
          const isCurrentToday = isToday(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isPast = isBefore(day, startOfToday()) && !isCompleted;

          return (
            <div
              key={day.toString()}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300",
                !isCurrentMonth && "opacity-20 pointer-events-none",
                isCurrentMonth && "hover:bg-primary/5 cursor-pointer"
              )}
            >
              {/* 날짜 숫자 */}
              <span className={cn(
                "text-sm font-medium mb-1",
                isCurrentToday ? "text-secondary-foreground font-bold" : "text-text"
              )}>
                {format(day, "d")}
              </span>

              {/* 상태 표시 원 */}
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500",
                isCompleted && "bg-primary text-white scale-100 shadow-md",
                isCurrentToday && !isCompleted && "border-2 border-secondary bg-secondary/20 scale-105",
                isPast && isCurrentMonth && "bg-slate-100 scale-90",
                !isCompleted && !isCurrentToday && !isPast && "bg-transparent"
              )}>
                {isCompleted && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>

              {/* 오늘 표시 뱃지 */}
              {isCurrentToday && (
                <span className="absolute -top-1 right-0 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
