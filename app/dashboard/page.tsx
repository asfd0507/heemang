"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  parseISO,
  getISOWeek,
  getDayOfYear
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Sparkles, X, Check, PenLine, LogOut, Lock, Share2, Download, Heart, MessageCircle } from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DAILY_QUESTIONS, WEEKLY_QUESTIONS, MONTHLY_QUESTIONS } from "@/lib/question/questions";

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
  const [sharingData, setSharingData] = useState<{ date: Date; question: string; answer: string; year: string } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const today = startOfToday();

  // Kakao SDK 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      if (!Kakao.isInitialized()) {
        Kakao.init("84fc52d1ac73cfa4e79dcbb774fae4d3");
      }
    }
  }, []);

  // Modal Closure Logic (ESC & Backdrop)
  const closeAllModals = useCallback(() => {
    setIsWriteModalOpen(false);
    setSelectedDate(null);
    setSharingData(null);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllModals();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeAllModals]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: planData } = await supabase
      .from("diary_plans")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    setPlan(planData);

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

  // 날짜와 주기에 맞는 질문을 반환하는 함수 (Import된 대형 데이터셋 사용)
  const getQuestionForDate = useCallback((date: Date, freq: string) => {
    if (freq === "daily") {
      const index = (getDayOfYear(date) - 1) % DAILY_QUESTIONS.length;
      return DAILY_QUESTIONS[index];
    } else if (freq === "weekly") {
      const weekNum = getISOWeek(date);
      const index = (weekNum - 1) % WEEKLY_QUESTIONS.length;
      return WEEKLY_QUESTIONS[index];
    } else if (freq === "monthly") {
      const index = date.getMonth() % MONTHLY_QUESTIONS.length;
      return MONTHLY_QUESTIONS[index];
    }
    return DAILY_QUESTIONS[0];
  }, []);

  const question = getQuestionForDate(today, frequency);

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleShareClick = (date: Date, q: string, answer: string, year: string) => {
    setSharingData({ date, question: q, answer, year });
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1 });
      const link = document.createElement('a');
      link.download = `미래의조각_${format(new Date(), 'yyyyMMdd_HHmmss')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  const handleKakaoShare = async () => {
    if (!cardRef.current || !sharingData) return;
    
    // 1. SDK 로드 여부 확인
    let Kakao = (window as any).Kakao;
    
    // 만약 아직 로드 전이라면 수동으로라도 확인 (재시도)
    if (!Kakao) {
      alert("카카오톡 기능을 준비 중입니다. 1~2초 후 다시 눌러주세요.");
      return;
    }

    // 2. 초기화 여부 확인 및 실행
    if (!Kakao.isInitialized()) {
      try {
        Kakao.init("84fc52d1ac73cfa4e79dcbb774fae4d3");
      } catch (e) {
        console.error("Kakao init error:", e);
      }
    }

    setIsSharing(true);
    try {
      // 1. 이미지를 Blob으로 캡처
      const blob = await toBlob(cardRef.current, { cacheBust: true, quality: 0.95 });
      if (!blob) throw new Error("Failed to capture image");

      // 2. Blob을 File 객체로 변환
      const file = new File([blob], 'share.png', { type: 'image/png' });

      // 3. 카카오 서버에 이미지 업로드
      const uploadResponse = await Kakao.Share.uploadImage({
        file: [file],
      });

      const imageUrl = uploadResponse.infos.original.url;

      // 4. 카카오톡 메시지 전송
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '미래의 조각으로부터 도착한 메시지',
          description: `"${sharingData.question}" 에 대한 나의 기록`,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin,
          },
        },
        buttons: [
          {
            title: '나도 기록하기',
            link: {
              mobileWebUrl: window.location.origin,
              webUrl: window.location.origin,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Kakao share failed:', error);
      alert("카카오톡 공유에 실패했습니다.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDayClick = (day: Date) => {
    if (isMonthly || isSameMonth(day, monthStart)) {
      setSelectedDate(day);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !user || !plan) return;

    const { error } = await supabase
      .from("answers")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        content: newAnswer,
        answer_date: format(today, "yyyy-MM-dd"),
        cycle_year: 1, // Simplified for now
      });

    if (error) {
      console.error(error);
      alert("답변 저장 중 오류가 발생했습니다.");
    } else {
      setNewAnswer("");
      setIsWriteModalOpen(false);
      fetchData(); 
    }
  };

  const getAnswerForDate = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return answers.find(a => a.answer_date === dateStr);
  };

  const isDateInCompletedPeriod = (day: Date) => {
    if (frequency === "daily") return !!getAnswerForDate(day);
    if (frequency === "weekly") {
      const wStart = startOfWeek(day);
      const wEnd = endOfWeek(day);
      return answers.some(a => {
        const d = parseISO(a.answer_date);
        return d >= wStart && d <= wEnd;
      });
    }
    if (frequency === "monthly") {
      const targetMonth = format(day, "yyyy-MM");
      return answers.some(a => a.answer_date.startsWith(targetMonth));
    }
    return false;
  };

  const isPeriodCompleted = () => isDateInCompletedPeriod(today);
  const periodCompleted = isPeriodCompleted();

  const isMonthCompleted = (monthIndex: number) => {
    const targetMonthStr = String(monthIndex + 1).padStart(2, '0');
    const targetYearStr = String(currentMonth.getFullYear());
    return answers.some(a => a.answer_date.startsWith(`${targetYearStr}-${targetMonthStr}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="animate-pulse text-[#8E8E93] font-bold">진심을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20 pt-28 px-4 md:px-6 transition-colors duration-500">
      <div className="container mx-auto max-w-4xl space-y-8 animate-in fade-in duration-1000">
        
        {/* 1. Header / Question Summary Area (Notepad Style) */}
        <section className="animate-in slide-in-from-top-4 duration-700">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#3A7BD5]/5 rounded-[2rem] blur-xl group-hover:bg-[#3A7BD5]/10 transition-all duration-500" />
            <div className="relative bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[#E5E5E1] overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Paper Texture Decor */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3A7BD5]/20 to-transparent" />
              
              <div className="space-y-3 flex-1 relative z-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors",
                    periodCompleted ? "bg-green-50 text-green-600" : "bg-[#F5F5F7] text-[#3A7BD5] border border-[#3A7BD5]/20"
                  )}>
                    {periodCompleted ? "Completed" : "Daily Fragment"}
                  </span>
                  <span className="text-[12px] font-bold text-[#8E8E93] tracking-tight">
                    {format(today, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#2C2C2E] leading-relaxed">
                  {periodCompleted 
                    ? `${frequency === "daily" ? "오늘" : frequency === "weekly" ? "이번 주" : "이번 달"}의 조각을 남겼습니다.` 
                    : `"${question}"`
                  }
                </h1>
              </div>
              
              {!periodCompleted && (
                <Button 
                  onClick={() => setIsWriteModalOpen(true)}
                  className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white rounded-2xl h-14 px-10 flex items-center gap-3 shadow-xl shadow-[#3A7BD5]/20 hover:scale-105 active:scale-95 transition-all border-none font-black text-base relative z-10"
                >
                  <PenLine className="h-4 w-4" />
                  기록하기
                </Button>
              )}
              {periodCompleted && (
                <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 border border-green-100 shadow-sm relative z-10 animate-in zoom-in duration-500">
                  <Check className="h-7 w-7 stroke-[3px]" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Calendar / Progress Area (Minimalist Style) */}
        <section className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-[#E5E5E1] space-y-12">
            <header className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-[#2C2C2E] tracking-tighter">
                  {isMonthly 
                    ? `${format(currentMonth, "yyyy년")}의 조각` 
                    : format(currentMonth, "yyyy년 M월", { locale: ko })
                  }
                </h2>
                <p className="text-sm text-[#8E8E93] font-bold tracking-tight">
                  {isMonthly ? "올해의 변화를 한눈에 살펴보세요." : "날짜를 선택해 과거의 나를 만나보세요."}
                </p>
              </div>
              {!isMonthly && (
                <div className="flex bg-[#F5F5F7] border border-[#E5E5E1] rounded-2xl p-1.5 items-center gap-1 shadow-inner">
                  <button onClick={prevMonth} className="p-2.5 hover:bg-white rounded-xl transition-all active:scale-90 text-[#8E8E93] hover:text-[#2C2C2E]"><ChevronLeft className="h-5 w-5" /></button>
                  <button 
                    onClick={goToToday}
                    className="px-5 py-1.5 hover:bg-white rounded-xl transition-all active:scale-90 text-xs font-black text-[#2C2C2E]"
                  >
                    오늘
                  </button>
                  <button onClick={nextMonth} className="p-2.5 hover:bg-white rounded-xl transition-all active:scale-90 text-[#8E8E93] hover:text-[#2C2C2E]"><ChevronRight className="h-5 w-5" /></button>
                </div>
              )}
            </header>

            {isMonthly ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                        "aspect-[4/3] rounded-[2rem] transition-all duration-700 flex flex-col items-center justify-center gap-3 cursor-pointer group relative overflow-hidden border",
                        completed 
                          ? "bg-[#F5F5F7] border-[#3A7BD5]/20 shadow-sm" 
                          : "bg-white border-[#E5E5E1] hover:border-[#3A7BD5]/30 shadow-none hover:shadow-lg hover:shadow-[#3A7BD5]/5",
                        isCurrentMonthBox && !completed && "border-[#3A7BD5] border-dashed bg-[#3A7BD5]/5"
                      )}
                    >
                      <span className={cn(
                        "text-xl font-black transition-colors",
                        completed ? "text-[#3A7BD5]" : "text-[#2C2C2E]/30"
                      )}>{i + 1}월</span>
                      
                      {completed ? (
                        <div className="text-[#3A7BD5] bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-[#3A7BD5]/10 animate-in zoom-in duration-500">
                          <Check className="h-5 w-5 stroke-[3px]" />
                        </div>
                      ) : isCurrentMonthBox ? (
                        <Sparkles className="h-6 w-6 text-[#3A7BD5] fill-[#3A7BD5]/10 animate-pulse" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-[#E5E5E1] border-dotted" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-7 border-b border-[#E5E5E1] pb-6">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                    <div key={day} className={cn(
                      "text-center text-[12px] font-black uppercase tracking-widest",
                      idx === 0 ? "text-[#FF6B6B]" : idx === 6 ? "text-[#3A7BD5]" : "text-[#8E8E93]"
                    )}>{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 relative">
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
                          "relative aspect-square flex flex-col items-center justify-center p-1 transition-all duration-500 cursor-pointer group rounded-full",
                          isCurrentMonth ? "bg-transparent" : "opacity-0 pointer-events-none",
                          isCurrentMonth && "hover:bg-[#3A7BD5]/5"
                        )}
                      >
                        <span className={cn(
                          "text-[13px] font-black z-10 relative mb-1 transition-colors",
                          isCurrentToday ? "text-[#3A7BD5]" : isCurrentMonth ? "text-[#2C2C2E]/40 group-hover:text-[#2C2C2E]" : "text-transparent"
                        )}>
                          {isCurrentMonth ? format(day, "d") : ""}
                        </span>

                        <div className="h-10 w-10 flex items-center justify-center relative z-10">
                          {exactAnswer ? (
                            <div className="h-full w-full rounded-2xl bg-white border border-[#3A7BD5]/20 flex items-center justify-center text-[#3A7BD5] animate-in zoom-in duration-500 shadow-sm">
                              <Check className="h-5 w-5 stroke-[3px]" />
                            </div>
                          ) : isCompleted && (isWeekly || isMonthly) ? (
                            <div className="h-2 w-2 rounded-full bg-[#3A7BD5]/30 animate-pulse" />
                          ) : isCurrentToday && !periodCompleted ? (
                            <div className="h-full w-full rounded-2xl bg-[#3A7BD5]/5 border border-[#3A7BD5]/30 border-dashed flex items-center justify-center text-[#3A7BD5] animate-pulse">
                              <Sparkles className="h-5 w-5 fill-[#3A7BD5]/10" />
                            </div>
                          ) : null}
                        </div>

                        {isCurrentToday && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-[#3A7BD5] rounded-full z-20" />
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
            className="fixed inset-0 bg-[#2C2C2E]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={closeAllModals}
          >
            <div 
              className="bg-white w-full max-w-xl flex flex-col overflow-hidden shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300 relative border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="p-10 border-b border-[#E5E5E1] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3A7BD5] to-[#00D2FF]" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#3A7BD5]/10 flex items-center justify-center text-[#3A7BD5]">
                      <PenLine className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-black text-[#8E8E93] uppercase tracking-widest">{format(today, "yyyy년 M월 d일", { locale: ko })}</span>
                  </div>
                  <button 
                    onClick={closeAllModals} 
                    className="p-2.5 hover:bg-[#F5F5F7] rounded-full transition-all border border-transparent hover:border-[#E5E5E1] shadow-none hover:shadow-sm"
                  >
                    <X className="h-5 w-5 text-[#8E8E93]" />
                  </button>
                </div>
                <h3 className="text-2xl font-black text-[#2C2C2E] leading-tight pr-8 tracking-tight">{question}</h3>
              </header>

              <form onSubmit={handleAnswerSubmit} className="flex-1 flex flex-col">
                <div className="p-10 pb-6">
                  <Textarea 
                    placeholder="당신의 진심을 담아보세요..."
                    className="w-full border-none focus-visible:ring-0 text-lg min-h-[350px] p-0 bg-transparent placeholder:text-[#8E8E93]/40 placeholder:text-lg leading-relaxed resize-none scrollbar-hide font-medium text-[#2C2C2E]"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    autoFocus
                  />
                </div>
                <footer className="p-10 pt-0 flex items-center justify-between mt-auto">
                  <p className="text-[11px] font-black text-[#8E8E93] uppercase tracking-widest">{newAnswer.length} chars</p>
                  <Button className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white h-14 rounded-2xl px-12 gap-3 shadow-xl shadow-[#3A7BD5]/20 border-none font-black text-base transition-all" disabled={!newAnswer.trim()}>
                    봉인하기 <Check className="h-5 w-5" />
                  </Button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {/* 4. Archive Detail Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-[#2C2C2E]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={closeAllModals}>
            <div className="bg-white w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300 relative" onClick={(e) => e.stopPropagation()}>
              <header className="p-10 border-b border-[#E5E5E1] flex items-center justify-between sticky top-0 z-10 bg-white/80 backdrop-blur-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[#3A7BD5] text-[10px] font-black uppercase tracking-widest border border-[#3A7BD5]/10">Archive Fragment</span>
                    <span className="text-[12px] font-bold text-[#8E8E93]">
                      {isMonthly 
                        ? format(selectedDate, "yyyy년 M월", { locale: ko })
                        : format(selectedDate, "M월 d일", { locale: ko })
                      }
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2C2C2E] tracking-tighter leading-tight pr-4">
                    "{getQuestionForDate(selectedDate, frequency)}"
                  </h3>
                </div>
                <button 
                  onClick={closeAllModals} 
                  className="p-2.5 hover:bg-[#F5F5F7] rounded-full transition-all border border-transparent hover:border-[#E5E5E1] shadow-none hover:shadow-sm"
                >
                  <X className="h-5 w-5 text-[#8E8E93]" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide bg-white">
                {(() => {
                  const targetMonthIdx = selectedDate.getMonth();
                  const targetWeekNum = getISOWeek(selectedDate);
                  
                  const yearlyAnswers = answers.filter(a => {
                    const answerDate = parseISO(a.answer_date);
                    if (isMonthly) {
                      return answerDate.getMonth() === targetMonthIdx;
                    }
                    if (isWeekly) {
                      return getISOWeek(answerDate) === targetWeekNum;
                    }
                    return format(answerDate, "MM-dd") === format(selectedDate, "MM-dd");
                  });

                  if (yearlyAnswers.length === 0) {
                    return (
                      <div className="py-24 text-center space-y-5">
                        <div className="mx-auto w-16 h-16 bg-[#F5F5F7] rounded-[2rem] flex items-center justify-center text-[#8E8E93]/30">
                          <Lock className="h-7 w-7" />
                        </div>
                        <p className="text-sm text-[#8E8E93] italic font-bold">아직 남겨진 조각이 없습니다.</p>
                      </div>
                    );
                  }

                  return yearlyAnswers.map((item) => (
                    <div key={item.id} className="space-y-3 group pb-10 border-b border-[#E5E5E1] last:border-none relative">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm font-black text-[#2C2C2E] tracking-tight">{format(parseISO(item.answer_date), "yyyy년")}</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-[#E5E5E1] to-transparent opacity-50" />
                        </div>
                        <button 
                          onClick={() => handleShareClick(selectedDate!, getQuestionForDate(selectedDate!, frequency), item.content, format(parseISO(item.answer_date), "yyyy"))}
                          className="p-2 text-[#8E8E93] hover:text-[#3A7BD5] hover:bg-[#3A7BD5]/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="이미지로 공유하기"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-[#2C2C2E] font-medium transition-all leading-[1.8] text-lg pr-4">
                        {item.content}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 5. Share Preview Modal (Analog Polaroid) */}
        {sharingData && (
          <div className="fixed inset-0 bg-[#2C2C2E]/80 backdrop-blur-md z-[130] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
              
              {/* Polaroid Card Area */}
              <div 
                ref={cardRef}
                className="w-full aspect-square bg-white p-8 shadow-2xl flex flex-col relative overflow-hidden"
                style={{ minHeight: '400px' }}
              >
                <header className="mb-8">
                  <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em] mb-2 opacity-60">Memory Fragment</p>
                  <h4 className="text-sm font-black text-[#2C2C2E] leading-relaxed line-clamp-2">
                    "{sharingData.question}"
                  </h4>
                </header>

                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[#2C2C2E] text-base leading-[2] text-center font-medium px-2">
                    {sharingData.answer}
                  </p>
                </div>

                <footer className="mt-8 pt-6 border-t border-[#F5F5F7] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#3A7BD5] uppercase tracking-widest">{sharingData.year}년의 조각</span>
                    <span className="text-[9px] font-bold text-[#C7C7CC]">{format(sharingData.date, "MM월 dd일")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#2C2C2E] tracking-tighter">미래의 조각</span>
                  </div>
                </footer>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 w-full">
                <Button 
                  onClick={closeAllModals}
                  variant="ghost"
                  className="flex-1 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-black border-none"
                >
                  닫기
                </Button>
                <div className="flex-[2] flex gap-2">
                  <Button 
                    onClick={handleDownloadImage}
                    className="flex-1 h-14 rounded-2xl bg-white text-[#2C2C2E] hover:bg-[#F5F5F7] shadow-xl shadow-black/5 font-black gap-2 border-none"
                  >
                    <Download className="h-5 w-5" />
                    저장
                  </Button>
                  <Button 
                    onClick={handleKakaoShare}
                    disabled={isSharing}
                    className="flex-1 h-14 rounded-2xl bg-[#FEE500] text-[#191919] hover:bg-[#FADA0A] shadow-xl shadow-[#FEE500]/20 font-black gap-2 border-none"
                  >
                    <MessageCircle className="h-5 w-5 fill-[#191919]" />
                    {isSharing ? "진행중..." : "카톡"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
