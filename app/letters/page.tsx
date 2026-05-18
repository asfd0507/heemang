"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Lock, Unlock, Calendar, Send, X, Check, Eye } from "lucide-react";
import { format, addYears, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Letter {
  id: string;
  title: string;
  content: string;
  open_at: string;
  created_at: string;
  is_read: boolean;
}

export default function LettersPage() {
  const supabase = createClient();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedYears, setSelectedYears] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasAvailableLetters, setHasAvailableLetters] = useState(false);

  const fetchLetters = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("future_letters")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setLetters(data);
      // 열 수 있으면서 아직 읽지 않은 편지가 있는지 체크
      const available = data.some(letter => 
        !isAfter(new Date(letter.open_at), new Date()) && !letter.is_read
      );
      setHasAvailableLetters(available);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleSaveLetter = async () => {
    if (!content.trim() || !title.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const openDate = addYears(new Date(), selectedYears);

    const { error } = await supabase.from("future_letters").insert({
      user_id: user.id,
      title: title,
      content: content,
      open_at: openDate.toISOString(),
    });

    if (!error) {
      setTitle("");
      setContent("");
      setIsWriteModalOpen(false);
      setSelectedYears(1);
      fetchLetters();
    }
  };

  const handleOpenLetter = async (letter: Letter) => {
    const isAvailable = !isAfter(new Date(letter.open_at), new Date());
    if (!isAvailable) return;

    setSelectedLetter(letter);

    if (!letter.is_read) {
      const { error } = await supabase
        .from("future_letters")
        .update({ is_read: true })
        .eq("id", letter.id);
      
      if (!error) {
        fetchLetters(); // 리스트 갱신하여 빨간 점 업데이트
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-28 pb-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* 헤더 섹션 */}
        <div className="flex items-end justify-between px-2">
          <div className="relative">
            <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight flex items-center gap-3">
              미래의 편지함
              {hasAvailableLetters && (
                <span className="w-2.5 h-2.5 bg-[#E03E3E] rounded-full ring-4 ring-[#E03E3E]/10 animate-pulse" />
              )}
            </h1>
            <p className="text-[#86868B] mt-1 text-sm font-medium">시간이 흘러야만 열리는 소중한 진심들</p>
          </div>
          <Button 
            onClick={() => setIsWriteModalOpen(true)}
            className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white rounded-full h-11 px-6 gap-2 shadow-lg shadow-[#3A7BD5]/20 transition-all hover:scale-105 active:scale-95"
          >
            <Mail className="h-4 w-4 text-white" />
            <span className="font-bold text-sm text-white">편지 쓰기</span>
          </Button>
        </div>

        {/* 편지 리스트 */}
        <div className="grid gap-6">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-[#86868B] font-bold">편지를 불러오는 중...</div>
          ) : letters.length === 0 ? (
            <div className="mac-card p-24 flex flex-col items-center justify-center text-[#86868B] bg-white text-center">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-6">
                <Mail className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-black text-[#1D1D1F] text-lg">아직 작성된 편지가 없습니다.</p>
              <p className="text-sm mt-2 font-medium">미래의 나에게 첫 번째 진심을 전해보세요.</p>
            </div>
          ) : (
            letters.map((letter) => {
              const isAvailable = !isAfter(new Date(letter.open_at), new Date());
              return (
                <Card 
                  key={letter.id} 
                  onClick={() => handleOpenLetter(letter)}
                  className={cn(
                    "mac-card p-8 bg-white overflow-hidden relative group transition-all duration-500",
                    isAvailable ? "cursor-pointer hover:shadow-xl hover:translate-y-[-2px]" : "cursor-default"
                  )}
                >
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                        <Lock className="h-6 w-6 text-[#3A7BD5]" />
                      </div>
                      <p className="font-black text-[#1D1D1F]">봉인된 편지</p>
                      <p className="text-[11px] text-[#86868B] font-bold mt-1">
                        {format(new Date(letter.open_at), "yyyy년 MM월 dd일", { locale: ko })} 공개
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-[#86868B] text-[10px] font-black uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(letter.created_at), "yyyy. MM. dd")} 작성
                    </div>
                    <div className="flex items-center gap-2">
                      {isAvailable && !letter.is_read && (
                        <span className="w-2 h-2 bg-[#E03E3E] rounded-full animate-pulse" />
                      )}
                      {isAvailable ? <Unlock className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-[#D2D2D7]" />}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#1D1D1F] mb-2 tracking-tight">
                    {isAvailable ? letter.title : "비밀의 제목"}
                  </h3>
                  <p className="text-[#86868B] text-sm font-medium">
                    {isAvailable ? "클릭하여 내용을 확인하세요" : "작성된 내용은 아직 비밀입니다."}
                  </p>
                  {isAvailable && (
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-1 transition-all",
                      letter.is_read ? "bg-[#F5F5F7]" : "bg-gradient-to-r from-[#3A7BD5] to-[#00D2FF]"
                    )} />
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 1. 편지 작성 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsWriteModalOpen(false)}>
          <div className="mac-card w-full max-w-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-white" onClick={(e) => e.stopPropagation()}>
            <header className="p-8 border-b border-[#D2D2D7]/30 flex flex-col bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#3A7BD5]/10 text-[#3A7BD5] text-[10px] font-bold uppercase tracking-wider">Time Capsule</span>
                  <span className="text-xs font-medium text-[#86868B]">미래로 보내는 편지</span>
                </div>
                <button onClick={() => setIsWriteModalOpen(false)} className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors">
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight">몇 년 뒤의 나에게 보낼까요?</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <button key={year} onClick={() => setSelectedYears(year)} className={cn("flex-1 h-12 rounded-xl text-sm font-black transition-all", selectedYears === year ? "bg-[#3A7BD5] text-white shadow-lg shadow-[#3A7BD5]/20" : "bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]")}>
                      {year}년 뒤
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="p-8 pb-0 bg-white space-y-4">
              <input 
                type="text"
                placeholder="편지 제목을 입력하세요"
                className="w-full border-none focus-visible:ring-0 text-2xl font-black p-0 bg-transparent placeholder:text-[#D2D2D7] tracking-tight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="h-px bg-[#D2D2D7]/30" />
            </div>

            <div className="p-8 pt-4 bg-white">
              <Textarea 
                placeholder="미래의 당신에게 전하고 싶은 이야기를 적어보세요..."
                className="w-full border-none focus-visible:ring-0 text-lg min-h-[300px] p-4 bg-[#F5F5F7]/30 rounded-2xl placeholder:text-[#D2D2D7] leading-relaxed resize-none scrollbar-hide"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            
            <footer className="p-8 pt-0 flex items-center justify-between bg-white">
              <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">글자수: {content.length}</p>
              <Button onClick={handleSaveLetter} className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white h-12 rounded-full px-10 gap-2 shadow-xl shadow-[#3A7BD5]/20 border-none font-bold" disabled={!content.trim() || !title.trim()}>
                봉인하기 <Check className="h-4 w-4" />
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* 2. 편지 읽기 모달 (팝업) */}
      {selectedLetter && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLetter(null)}>
          <div className="mac-card w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-white max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <header className="p-8 border-b border-[#D2D2D7]/30 flex flex-col bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-600 text-[10px] font-bold uppercase tracking-wider">Opened</span>
                  <span className="text-xs font-medium text-[#86868B]">미래에서 도착한 편지</span>
                </div>
                <button onClick={() => setSelectedLetter(null)} className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors">
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </div>
              <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tight leading-tight">
                {selectedLetter.title}
              </h2>
              <div className="flex items-center gap-4 mt-4 text-[11px] font-bold text-[#86868B] uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>작성: {format(new Date(selectedLetter.created_at), "yyyy. MM. dd")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#3A7BD5]">
                  <Eye className="h-3.5 w-3.5" />
                  <span>오늘 열어봄</span>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 bg-[#F5F5F7]/20 scrollbar-hide">
              <p className="text-[#1D1D1F] text-xl leading-[1.8] font-medium whitespace-pre-wrap">
                {selectedLetter.content}
              </p>
            </div>

            <footer className="p-8 border-t border-[#D2D2D7]/30 flex justify-center bg-white">
              <Button onClick={() => setSelectedLetter(null)} className="bg-[#1D1D1F] hover:bg-black text-white rounded-full px-12 h-12 font-bold shadow-lg transition-all">
                확인했습니다
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
