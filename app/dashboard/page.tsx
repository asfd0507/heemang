"use client";

import { useState, useEffect } from "react";
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
  startOfToday,
  getDay
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Send, Sparkles, Lock, Unlock, X, Check, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// --- Dummy Data ---
const dummyCompletedDates = [
  new Date(2026, 4, 1),
  new Date(2026, 4, 2),
  new Date(2026, 4, 4),
  new Date(2026, 4, 5),
  new Date(2026, 4, 6),
  new Date(2026, 4, 7),
];

const dummyArchiveData = {
  "2026-05-01": [
    { year: 2026, answer: "오늘은 정말 기분 좋은 날이었어요.", date: "2026.05.01" },
    { year: 2025, answer: "작년의 나는 참 바빴네요.", date: "2025.05.01" }
  ],
  "2026-05-08": [
    { year: 2026, answer: "행복은 멀리 있지 않다는 걸 깨달았어요.", date: "2026.05.08" },
    { year: 2025, answer: "맛있는 걸 먹어서 행복했습니다.", date: "2025.05.08" }
  ]
};

export default function UnifiedPage() {
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [answer, setAnswer] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 8));
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  // 온보딩 설정 불러오기
  useEffect(() => {
    const settings = localStorage.getItem("diary_settings");
    if (settings) {
      const { frequency: savedFrequency } = JSON.parse(settings);
      setFrequency(savedFrequency);
    }
  }, []);

  const today = new Date();
  const questionsByFrequency = {
    daily: "당신이 가장 행복했던 순간은 언제인가요?",
    weekly: "이번 주 가장 보람찼던 일은 무엇인가요?",
    monthly: "지난 한 달 동안 당신은 어떻게 성장했나요?"
  };
  const question = questionsByFrequency[frequency];

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleDayClick = (day: Date) => {
    if (isSameMonth(day, monthStart)) {
      setSelectedDate(day);
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setHasAnsweredToday(true);
    setIsWriteModalOpen(false);
  };

  // 해당 주/월의 답변 완료 여부 체크
  const isPeriodCompleted = (day: Date) => {
    if (frequency === "daily") {
      return dummyCompletedDates.some(d => isSameDay(d, day)) || (isToday(day) && hasAnsweredToday);
    }
    if (frequency === "weekly") {
      const wStart = startOfWeek(day);
      const wEnd = endOfWeek(day);
      return dummyCompletedDates.some(d => d >= wStart && d <= wEnd) || 
             (isToday(day) && hasAnsweredToday) ||
             (isSameDay(startOfWeek(today), wStart) && hasAnsweredToday);
    }
    if (frequency === "monthly") {
      const mStart = startOfMonth(day);
      const mEnd = endOfMonth(day);
      return dummyCompletedDates.some(d => d >= mStart && d <= mEnd) ||
             (isToday(day) && hasAnsweredToday) ||
             (isSameMonth(day, today) && hasAnsweredToday);
    }
    return false;
  };

  // 주기에 따른 해당 일 여부 체크
  const isTargetDay = (day: Date) => {
    if (frequency === "daily") return true;
    // 주간/월간은 모든 날이 잠재적 기록일
    if (frequency === "weekly" || frequency === "monthly") return true;
    return false;
  };

  const periodCompleted = isPeriodCompleted(today);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20 pt-10 px-4 md:px-6">
      <div className="container mx-auto max-w-4xl space-y-10 animate-in fade-in duration-700">
        
        {/* 1. Header / Question Summary Area */}
        <section className="animate-in slide-in-from-top-4 duration-700">
          <div className="mac-card p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-[#007AFF]">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  periodCompleted ? "bg-green-100 text-green-600" : "bg-[#007AFF]/10 text-[#007AFF]"
                )}>
                  {periodCompleted ? "Completed" : "Today's Question"}
                </span>
                <span className="text-xs font-medium text-[#86868B]">
                  {format(today, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                  <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                    {frequency} cycle
                  </span>
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1D1D1F] leading-snug">
                {!isTargetDay(today) 
                  ? "오늘은 기록하는 날이 아닙니다." 
                  : periodCompleted 
                    ? `${frequency === "daily" ? "오늘" : frequency === "weekly" ? "이번 주" : "이번 달"}의 답변을 완료했습니다.` 
                    : `"${question}"`
                }
              </h1>
            </div>
            
            {isTargetDay(today) && !periodCompleted && (
              <Button 
                onClick={() => setIsWriteModalOpen(true)}
                className="mac-button-primary rounded-full h-12 px-8 flex items-center gap-2 shadow-lg hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                <PenLine className="h-4 w-4" />
                답변 남기기
              </Button>
            )}
            {(periodCompleted || !isTargetDay(today)) && (
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 border border-green-100">
                <Check className="h-6 w-6" />
              </div>
            )}
          </div>
        </section>

        {/* 2. Calendar Area */}
        <section className="space-y-6">
          <div className="mac-card p-6 md:p-10 space-y-10">
            <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  {format(currentMonth, "yyyy년 M월", { locale: ko })}
                </h2>
                <p className="text-xs text-[#86868B] font-medium">날짜를 눌러 과거의 나를 만나보세요.</p>
              </div>
              <div className="flex bg-[#F5F5F7] border border-[#D2D2D7]/30 rounded-xl p-1 items-center gap-1">
                <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all active:scale-90"><ChevronLeft className="h-4 w-4" /></button>
                <button 
                  onClick={goToToday}
                  className="px-3 py-1 hover:bg-white rounded-lg transition-all active:scale-90 text-[11px] font-bold text-[#1D1D1F]"
                >
                  오늘
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all active:scale-90"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </header>

            <div className="space-y-2">
              <div className="grid grid-cols-7 border-b border-[#D2D2D7]/20 pb-4">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <div key={day} className="text-center text-[11px] font-black text-[#86868B] uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-[#D2D2D7]/20 border border-[#D2D2D7]/20 rounded-2xl overflow-hidden shadow-inner bg-[#F5F5F7]">
                {calendarDays.map((day) => {
                  const isRecordDay = isTargetDay(day);
                  const isCompleted = isPeriodCompleted(day);
                  const isCurrentToday = isToday(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isPast = isBefore(day, startOfToday());
                  
                  // Missed logic for weekly/monthly:
                  // For weekly: if the week is past and not completed
                  // For monthly: if the month is past and not completed
                  // For daily: if the day is past and not completed
                  let isMissed = false;
                  if (frequency === "daily") {
                    isMissed = isPast && !isCompleted && isCurrentMonth;
                  } else if (frequency === "weekly") {
                    const isWeekPast = isBefore(endOfWeek(day), startOfToday());
                    isMissed = isWeekPast && !isCompleted && isCurrentMonth;
                  } else if (frequency === "monthly") {
                    const isMonthPast = isBefore(endOfMonth(day), startOfToday());
                    isMissed = isMonthPast && !isCompleted && isCurrentMonth;
                  }

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "relative aspect-square bg-white flex flex-col items-start p-2.5 transition-all duration-200 cursor-pointer group",
                        !isCurrentMonth && "bg-[#F5F5F7] opacity-20 pointer-events-none",
                        isCurrentMonth && "hover:bg-[#F5F5F7]/80",
                        !isRecordDay && "bg-[#FAFAFA]/50"
                      )}
                    >
                      {/* 날짜 숫자 - 왼쪽 상단 */}
                      <span className={cn(
                        "text-[12px] font-bold leading-none",
                        isCurrentToday ? "text-[#007AFF]" : "text-[#1D1D1F]/40"
                      )}>
                        {format(day, "d")}
                      </span>

                      {/* 상태 표시 - 중앙 배치 */}
                      <div className="flex-1 flex items-center justify-center w-full">
                        {!isRecordDay ? (
                          <div className="text-[9px] text-slate-300 font-medium uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                            Rest
                          </div>
                        ) : isCompleted ? (
                          <div className="h-10 w-10 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] animate-in zoom-in duration-300">
                            <Check className="h-6 w-6 stroke-[3px]" />
                          </div>
                        ) : isCurrentToday ? (
                          <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500 animate-pulse border border-amber-200">
                            <Sparkles className="h-6 w-6" />
                          </div>
                        ) : isMissed ? (
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <X className="h-4 w-4" />
                          </div>
                        ) : null}
                      </div>

                      {/* 오늘 하단 강조 */}
                      {isCurrentToday && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 bg-[#007AFF] rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Write Answer Modal */}
        {isWriteModalOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setIsWriteModalOpen(false)}
          >
            <div 
              className="mac-card w-full max-w-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="p-8 border-b border-[#D2D2D7]/30 flex flex-col bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-bold uppercase tracking-wider">Writing</span>
                    <span className="text-xs font-medium text-[#86868B]">{format(today, "yyyy년 M월 d일", { locale: ko })}</span>
                  </div>
                  <button 
                    onClick={() => setIsWriteModalOpen(false)} 
                    className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-[#86868B]" />
                  </button>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#1D1D1F] leading-tight pr-8">{question}</h3>
              </header>

              <form onSubmit={handleAnswerSubmit} className="flex-1 flex flex-col bg-white">
                <div className="p-8 pb-4">
                  <Textarea 
                    placeholder="당신의 마음을 남겨주세요..."
                    className="w-full border-none focus-visible:ring-0 text-base md:text-lg min-h-[300px] p-4 bg-transparent placeholder:text-[#D2D2D7] placeholder:text-base leading-relaxed resize-none scrollbar-hide"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    autoFocus
                  />
                </div>
                <footer className="p-8 pt-0 flex items-center justify-between mt-auto">
                  <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">글자수: {answer.length}</p>
                  <Button className="mac-button-primary h-12 rounded-full px-10 gap-2 shadow-xl shadow-[#007AFF]/20" disabled={!answer.trim()}>
                    저장하기 <Check className="h-4 w-4" />
                  </Button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {/* 4. Archive Detail Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="mac-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <header className="p-8 border-b border-[#D2D2D7]/30 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{format(selectedDate, "M월 d일", { locale: ko })}</h3>
                  <p className="text-xs text-[#86868B] font-medium mt-1">과거의 당신이 남긴 답변들입니다.</p>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)} 
                  className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#F5F5F7]/30">
                {[2026, 2025, 2024].map((year) => {
                  const key = `${year}-05-08`; // 더미용 고정 키
                  const entries = dummyArchiveData[key as keyof typeof dummyArchiveData] || [];
                  const entry = entries.find(e => e.year === year);
                  
                  return (
                    <div key={year} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#1D1D1F]">{year}년</span>
                      </div>
                      <div className={cn(
                        "p-6 rounded-[2rem] border transition-all leading-relaxed",
                        entry ? "bg-white border-[#D2D2D7]/30 shadow-sm text-[#1D1D1F] font-medium" : "bg-slate-100/50 border-transparent italic text-slate-400 text-sm text-center py-10"
                      )}>
                        {entry ? entry.answer : "이 날의 기록이 존재하지 않습니다."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
