"use client";

import { useState, useEffect, useCallback } from "react";
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
  parseISO
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Sparkles, X, Check, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

interface Answer {
  id: string;
  content: string;
  answer_date: string;
  cycle_year: number;
}

interface DiaryPlan {
  id: string;
  frequency: "daily" | "weekly" | "monthly";
  duration_years: number;
  start_date: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  
  // State
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<DiaryPlan | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfToday();

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // 1. Get Plan
    const { data: planData } = await supabase
      .from("diary_plans")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    setPlan(planData);

    // 2. Get Answers
    if (planData) {
      const { data: answersData } = await supabase
        .from("answers")
        .select("*")
        .eq("user_id", user.id)
        .order("answer_date", { ascending: false });
      
      setAnswers(answersData || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const frequency = plan?.frequency || "daily";
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

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !user || !plan) return;

    // Calculate cycle year (simplified for MVP: 1 for now)
    // In real app, you'd calculate: currentYear - planStartYear + 1
    const cycleYear = 1;

    const { error } = await supabase
      .from("answers")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        content: newAnswer,
        answer_date: format(today, "yyyy-MM-dd"),
        cycle_year: cycleYear,
      });

    if (error) {
      console.error(error);
      alert("답변 저장 중 오류가 발생했습니다.");
    } else {
      setNewAnswer("");
      setIsWriteModalOpen(false);
      fetchData(); // Refresh data
    }
  };

  // Logic to check if a date has an answer
  const getAnswerForDate = (day: Date) => {
    return answers.find(a => isSameDay(parseISO(a.answer_date), day));
  };

  // Logic to check if a specific day's period is completed
  const isDateInCompletedPeriod = (day: Date) => {
    if (frequency === "daily") {
      return !!getAnswerForDate(day);
    }
    if (frequency === "weekly") {
      const wStart = startOfWeek(day);
      const wEnd = endOfWeek(day);
      return answers.some(a => {
        const d = parseISO(a.answer_date);
        return d >= wStart && d <= wEnd;
      });
    }
    if (frequency === "monthly") {
      const mStart = startOfMonth(day);
      const mEnd = endOfMonth(day);
      return answers.some(a => {
        const d = parseISO(a.answer_date);
        return d >= mStart && d <= mEnd;
      });
    }
    return false;
  };

  // Logic to check if the current (today's) period is completed
  const isPeriodCompleted = () => {
    return isDateInCompletedPeriod(today);
  };

  const periodCompleted = isPeriodCompleted();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="animate-pulse text-[#86868B] font-bold">로딩 중...</div>
      </div>
    );
  }

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
                {periodCompleted 
                  ? `${frequency === "daily" ? "오늘" : frequency === "weekly" ? "이번 주" : "이번 달"}의 답변을 완료했습니다.` 
                  : `"${question}"`
                }
              </h1>
            </div>
            
            {!periodCompleted && (
              <Button 
                onClick={() => setIsWriteModalOpen(true)}
                className="mac-button-primary rounded-full h-12 px-8 flex items-center gap-2 shadow-lg hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                <PenLine className="h-4 w-4" />
                답변 남기기
              </Button>
            )}
            {periodCompleted && (
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
                <p className="text-xs text-[#86868B] font-medium">날짜를 눌러 기록을 확인하세요.</p>
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
                  const isCompleted = isDateInCompletedPeriod(day);
                  const isCurrentToday = isToday(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  
                  return (
                    <div
                      key={day.toString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "relative aspect-square bg-white flex flex-col items-start p-2.5 transition-all duration-200 cursor-pointer group",
                        !isCurrentMonth && "bg-[#F5F5F7] opacity-20 pointer-events-none",
                        isCurrentMonth && "hover:bg-[#F5F5F7]/80"
                      )}
                    >
                      <span className={cn(
                        "text-[12px] font-bold leading-none",
                        isCurrentToday ? "text-[#007AFF]" : "text-[#1D1D1F]/40"
                      )}>
                        {format(day, "d")}
                      </span>

                      <div className="flex-1 flex items-center justify-center w-full">
                        {isCompleted ? (
                          <div className="h-10 w-10 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] animate-in zoom-in duration-300">
                            <Check className="h-6 w-6 stroke-[3px]" />
                          </div>
                        ) : isCurrentToday && !periodCompleted ? (
                          <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500 animate-pulse border border-amber-200">
                            <Sparkles className="h-6 w-6" />
                          </div>
                        ) : null}
                      </div>

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
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    autoFocus
                  />
                </div>
                <footer className="p-8 pt-0 flex items-center justify-between mt-auto">
                  <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">글자수: {newAnswer.length}</p>
                  <Button className="mac-button-primary h-12 rounded-full px-10 gap-2 shadow-xl shadow-[#007AFF]/20" disabled={!newAnswer.trim()}>
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
                  <p className="text-xs text-[#86868B] font-medium mt-1">이 날의 기록들입니다.</p>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)} 
                  className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#F5F5F7]/30">
                {/* 
                  MVP에서는 '같은 날짜'에 대한 과거 연도 답변을 보여줍니다. 
                  예: 오늘이 5월 11일이면, 과거 모든 해의 5월 11일 답변을 필터링.
                  단, 주간/월간의 경우 해당 기간 내의 답변을 보여주도록 확장 가능.
                */}
                {(() => {
                  const targetMonth = format(selectedDate, "MM");
                  const targetDay = format(selectedDate, "dd");
                  
                  // 전체 답변 중 월/일이 같은 기록들 필터링
                  const yearlyAnswers = answers.filter(a => {
                    const d = parseISO(a.answer_date);
                    return format(d, "MM") === targetMonth && format(d, "dd") === targetDay;
                  });

                  if (yearlyAnswers.length === 0) {
                    return (
                      <div className="py-20 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                          <Lock className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-slate-400 italic font-medium">이 날의 기록이 존재하지 않습니다.</p>
                      </div>
                    );
                  }

                  return yearlyAnswers.map((item) => (
                    <div key={item.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#1D1D1F]">{format(parseISO(item.answer_date), "yyyy년")}</span>
                      </div>
                      <div className="p-6 rounded-[2rem] border bg-white border-[#D2D2D7]/30 shadow-sm text-[#1D1D1F] font-medium transition-all leading-relaxed">
                        {item.content}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// 간단한 Lock 아이콘 컴포넌트 추가 (lucide-react에 없을 경우 대비)
function Lock({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
