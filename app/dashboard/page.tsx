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
import { ChevronLeft, ChevronRight, Sparkles, X, BookOpen, PenLine, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const frequency = plan?.frequency || "daily";
  const isWeekly = frequency === "weekly";
  const isMonthly = frequency === "monthly";
  
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

  // 월간 답변 여부 체크 (1~12월용)
  const isMonthCompleted = (monthIndex: number) => {
    return answers.some(a => {
      const d = parseISO(a.answer_date);
      return d.getMonth() === monthIndex && d.getFullYear() === currentMonth.getFullYear();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8]">
        <div className="animate-pulse text-[#86868B] font-bold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] pb-20 pt-10 px-4 md:px-6">
      <div className="container mx-auto max-w-4xl space-y-10 animate-in fade-in duration-700">
        
        {/* 0. Top User Header */}
        <section className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3A7BD5] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#3A7BD5]/20">
              <Sparkles className="h-5 w-5 text-[#FFD54F] fill-[#FFD54F]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1F]">미래의 조각</h2>
              <p className="text-[11px] text-[#86868B] font-medium">
                <span className="text-[#3A7BD5] font-bold">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>님, 안녕하세요!
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-[#86868B] hover:text-[#E03E3E] hover:bg-red-50 rounded-xl gap-2 transition-colors h-10"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-bold">로그아웃</span>
          </Button>
        </section>

        {/* 1. Header / Question Summary Area */}
        <section className="animate-in slide-in-from-top-4 duration-700 mt-4">
          <div className="mac-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-[#3A7BD5] bg-white">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                  periodCompleted ? "bg-green-100 text-green-600" : "bg-[#3A7BD5]/10 text-[#3A7BD5]"
                )}>
                  {periodCompleted ? "Completed" : "Today's Question"}
                </span>
                <span className="text-[11px] font-medium text-[#86868B]">
                  {format(today, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#1D1D1F] leading-snug">
                {periodCompleted 
                  ? `${frequency === "daily" ? "오늘" : frequency === "weekly" ? "이번 주" : "이번 달"}의 답변을 완료했습니다.` 
                  : `"${question}"`
                }
              </h1>
            </div>
            
            {!periodCompleted && (
              <Button 
                onClick={() => setIsWriteModalOpen(true)}
                className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white rounded-full h-10 px-6 flex items-center gap-2 shadow-lg shadow-[#3A7BD5]/20 hover:translate-y-[-2px] active:translate-y-[0px] text-sm transition-all border-none"
              >
                <PenLine className="h-3.5 w-3.5" />
                답변 남기기
              </Button>
            )}
            {periodCompleted && (
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 border border-green-100">
                <BookOpen className="h-5 w-5" />
              </div>
            )}
          </div>
        </section>

        {/* 2. Calendar / Progress Area */}
        <section className="space-y-6">
          <div className="mac-card p-6 md:p-10 space-y-10 bg-white">
            <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  {frequency === "monthly" 
                    ? `${format(currentMonth, "yyyy년")} 기록` 
                    : format(currentMonth, "yyyy년 M월", { locale: ko })
                  }
                </h2>
                <p className="text-xs text-[#86868B] font-medium">
                  {frequency === "monthly" ? "올해의 조각들을 모아보세요." : "날짜를 눌러 기록을 확인하세요."}
                </p>
              </div>
              {frequency !== "monthly" && (
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
              )}
            </header>

            {frequency === "monthly" ? (
              /* --- 월간 모드: 1~12월 그리드 뷰 (모던하게 리뉴얼) --- */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => {
                  const completed = isMonthCompleted(i);
                  const isCurrentMonthBox = new Date().getMonth() === i && new Date().getFullYear() === currentMonth.getFullYear();
                  
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        const date = new Date(currentMonth.getFullYear(), i, 1);
                        handleDayClick(date);
                      }}
                      className={cn(
                        "aspect-[4/3] rounded-3xl transition-all duration-500 flex flex-col items-center justify-center gap-2 cursor-pointer group relative overflow-hidden",
                        completed 
                          ? "bg-[#3A7BD5]/5 shadow-[inset_0_0_0_1px_rgba(58,123,213,0.2)]" 
                          : "bg-[#F5F5F7]/50 hover:bg-[#F5F5F7] shadow-sm",
                        isCurrentMonthBox && !completed && "ring-2 ring-[#FFD54F]/50 bg-white"
                      )}
                    >
                      <span className={cn(
                        "text-base font-bold tracking-tight",
                        completed ? "text-[#3A7BD5]" : "text-[#1D1D1F]/40"
                      )}>{i + 1}월</span>
                      
                      {completed ? (
                        <div className="text-[#3A7BD5] animate-in zoom-in duration-500">
                          <BookOpen className="h-5 w-5 fill-[#3A7BD5]/10" />
                        </div>
                      ) : isCurrentMonthBox ? (
                        <Sparkles className="h-5 w-5 text-[#FFD54F] fill-[#FFD54F] animate-pulse" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-[#D2D2D7]/30 border-dashed" />
                      )}

                      {/* 하단 완료 바 (디테일) */}
                      {completed && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3A7BD5]/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- 일간/주간 모드: 기존 캘린더 뷰 (날짜 복구 & 모던화) --- */
              <div className="space-y-2">
                <div className="grid grid-cols-7 border-b border-[#D2D2D7]/20 pb-4">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                    <div key={day} className="text-center text-[11px] font-black text-[#86868B] uppercase tracking-widest">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-[#D2D2D7]/30 border border-[#D2D2D7]/30 rounded-2xl overflow-hidden shadow-sm relative">
                  {calendarDays.map((day) => {
                    const isCompleted = isDateInCompletedPeriod(day);
                    const exactAnswer = getAnswerForDate(day);
                    const isCurrentToday = isToday(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    
                    return (
                      <div
                        key={day.toString()}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "relative aspect-square flex flex-col items-start p-3 transition-all duration-300 cursor-pointer group",
                          isCurrentMonth ? "bg-white" : "bg-[#FFFDF8] pointer-events-none",
                          isCurrentMonth && "hover:bg-[#F5F5F7]/30"
                        )}
                      >
                        {/* 날짜 표시 (복구) */}
                        <span className={cn(
                          "text-[11px] font-bold z-10 relative",
                          isCurrentToday ? "text-[#3A7BD5]" : isCurrentMonth ? "text-[#1D1D1F]/30" : "text-transparent"
                        )}>
                          {isCurrentMonth ? format(day, "d") : ""}
                        </span>

                        <div className="flex-1 flex items-center justify-center w-full relative z-10">
                          {exactAnswer ? (
                            <div className="h-9 w-9 rounded-2xl bg-[#3A7BD5] flex items-center justify-center text-white animate-in zoom-in duration-300 shadow-lg shadow-[#3A7BD5]/20">
                              <BookOpen className="h-4 w-4" />
                            </div>
                          ) : isCompleted && (isWeekly || isMonthly) ? (
                            <div className="h-1 w-1 rounded-full bg-[#3A7BD5]/40" />
                          ) : isCurrentToday && !periodCompleted ? (
                            <div className="h-9 w-9 rounded-2xl bg-[#FFD54F]/10 flex items-center justify-center text-[#FFD54F] animate-pulse">
                              <Sparkles className="h-5 w-5 fill-[#FFD54F]" />
                            </div>
                          ) : null}
                        </div>

                        {isCurrentToday && (
                          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-3 bg-[#3A7BD5] rounded-full z-20" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Write Answer Modal */}
        {isWriteModalOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setIsWriteModalOpen(false)}
          >
            <div 
              className="mac-card w-full max-w-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="p-8 border-b border-[#D2D2D7]/30 flex flex-col bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#3A7BD5]/10 text-[#3A7BD5] text-[10px] font-bold uppercase tracking-wider">Writing</span>
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
                <footer className="p-8 pt-0 flex items-center justify-between mt-auto bg-white">
                  <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">글자수: {newAnswer.length}</p>
                  <Button className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white h-12 rounded-full px-10 gap-2 shadow-xl shadow-[#3A7BD5]/20 border-none" disabled={!newAnswer.trim()}>
                    저장하기 <BookOpen className="h-4 w-4" />
                  </Button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {/* 4. Archive Detail Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="mac-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-white">
              <header className="p-8 border-b border-[#D2D2D7]/30 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#3A7BD5]/10 text-[#3A7BD5] text-[10px] font-bold uppercase tracking-wider">Archive</span>
                    <span className="text-xs font-medium text-[#86868B]">{format(selectedDate, "M월 d일", { locale: ko })}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight leading-tight pr-4">"{question}"</h3>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)} 
                  className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#F5F5F7]/30">
                {(() => {
                  const targetMonth = format(selectedDate, "MM");
                  const targetDay = format(selectedDate, "dd");
                  
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
                      <div className="p-6 rounded-[2rem] border bg-white border-[#D2D2D7]/30 shadow-sm text-[#1D1D1F] font-medium transition-all leading-relaxed border-l-4 border-l-[#3A7BD5]">
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
