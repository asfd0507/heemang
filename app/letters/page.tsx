"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MailOpen, Lock, Calendar, X, Check, Eye, Sparkles, PenLine, Share2, Download, MessageCircle } from "lucide-react";
import { format, addYears, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toPng, toBlob } from "html-to-image";

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
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedYears, setSelectedYears] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "sealed" | "read">("all");
  
  const [sharingData, setSharingData] = useState<Letter | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const hasAvailableLetters = letters.some(letter => 
    !isAfter(new Date(letter.open_at), new Date()) && !letter.is_read
  );

  const filteredAndSortedLetters = letters
    .filter(letter => {
      const isAvailable = !isAfter(new Date(letter.open_at), new Date());
      if (filter === "unread") return isAvailable && !letter.is_read;
      if (filter === "sealed") return !isAvailable;
      if (filter === "read") return isAvailable && letter.is_read;
      return true;
    })
    .sort((a, b) => {
      const isAvailableA = !isAfter(new Date(a.open_at), new Date());
      const isAvailableB = !isAfter(new Date(b.open_at), new Date());
      
      const getPriority = (l: Letter, isAvail: boolean) => {
        if (isAvail && !l.is_read) return 1;
        if (!isAvail) return 2;
        return 3;
      };

      const priorityA = getPriority(a, isAvailableA);
      const priorityB = getPriority(b, isAvailableB);

      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const fetchLetters = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("future_letters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setLetters(data);
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

    setSelectedLetter({ ...letter, is_read: true });

    if (!letter.is_read) {
      setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, is_read: true } : l));
      const { data, error } = await supabase
        .from("future_letters")
        .update({ is_read: true })
        .eq("id", letter.id)
        .select();
      
      if (!error && data && data.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("letterRead"));
          router.refresh();
        }, 500);
      } else {
        fetchLetters();
      }
    }
  };

  const handleShareClick = (letter: Letter) => {
    setSharingData(letter);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1 });
      const link = document.createElement('a');
      link.download = `미래의조각_편지_${format(new Date(), 'yyyyMMdd_HHmmss')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  const handleKakaoShare = async () => {
    if (!cardRef.current || !sharingData) return;
    
    const Kakao = (window as any).Kakao;
    if (!Kakao) {
      alert("카카오톡 기능을 준비 중입니다. 1~2초 후 다시 눌러주세요.");
      return;
    }

    if (!Kakao.isInitialized()) {
      Kakao.init("84fc52d1ac73cfa4e79dcbb774fae4d3");
    }

    setIsSharing(true);
    try {
      const blob = await toBlob(cardRef.current, { cacheBust: true, quality: 0.95 });
      if (!blob) throw new Error("Failed to capture image");

      const file = new File([blob], 'share.png', { type: 'image/png' });
      const uploadResponse = await Kakao.Share.uploadImage({
        file: [file],
      });

      const imageUrl = uploadResponse.infos.original.url;

      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '미래에서 도착한 편지',
          description: `"${sharingData.title}" - 과거의 내가 보낸 진심`,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin,
          },
        },
        buttons: [
          {
            title: '나도 편지 쓰기',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="animate-pulse text-[#8E8E93] font-bold">진심을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-12 px-4 md:px-6 transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-1000">
        
        {/* Header */}
        <div className="flex items-end justify-between px-2">
          <div className="relative">
            <h1 className="text-2xl font-black text-[#2C2C2E] tracking-tight">
              미래의 편지함
            </h1>
            <p className="text-[#8E8E93] mt-2 text-sm font-bold tracking-tight">시간이 흘러야만 열리는 소중한 진심들</p>
          </div>
          <Button 
            onClick={() => setIsWriteModalOpen(true)}
            className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white rounded-2xl h-12 px-8 gap-3 shadow-xl shadow-[#3A7BD5]/20 transition-all hover:scale-105 active:scale-95 border-none font-black text-sm"
          >
            <Mail className="h-4 w-4 text-white" />
            편지 쓰기
          </Button>
        </div>

        {/* Filter Section */}
        <div className="flex gap-6 px-4 border-b border-[#E5E5E1] pb-0 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "전체", icon: Sparkles },
            { id: "unread", label: "도착", icon: Mail },
            { id: "sealed", label: "봉인", icon: Lock },
            { id: "read", label: "기록", icon: MailOpen },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={cn(
                  "pb-4 px-1 text-[13px] font-black transition-all flex items-center gap-2 relative",
                  isActive 
                    ? "text-[#3A7BD5]" 
                    : "text-[#8E8E93] hover:text-[#2C2C2E]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#3A7BD5]" : "text-current")} />
                <span className="tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7BD5] rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Letter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {filteredAndSortedLetters.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-[#8E8E93] bg-white rounded-[2.5rem] border border-[#E5E5E1] shadow-sm">
              <Mail className="h-12 w-12 opacity-10 mb-6" />
              <p className="font-black text-[#2C2C2E] text-xl tracking-tight">
                {filter === "all" ? "아직 작성된 편지가 없습니다." : "해당하는 편지가 없습니다."}
              </p>
              {filter === "all" && <p className="text-sm mt-2 font-bold tracking-tight">미래의 나에게 첫 번째 진심을 전해보세요.</p>}
            </div>
          ) : (
            filteredAndSortedLetters.map((letter) => {
              const isAvailable = !isAfter(new Date(letter.open_at), new Date());
              const isRead = letter.is_read;

              return (
                <Card 
                  key={letter.id} 
                  onClick={() => handleOpenLetter(letter)}
                  className={cn(
                    "relative aspect-[3/4] rounded-[2rem] overflow-hidden transition-all duration-500 group border-none",
                    isAvailable 
                      ? "cursor-pointer hover:shadow-2xl hover:translate-y-[-4px]" 
                      : "cursor-default"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 transition-all duration-500",
                    isAvailable 
                      ? isRead 
                        ? "bg-white border border-[#E5E5E1]" 
                        : "bg-white shadow-sm border border-white"
                      : "bg-white border-2 border-dashed border-[#E5E5E1]"
                  )} />

                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center z-10">
                    <div className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110",
                      isAvailable 
                        ? isRead 
                          ? "bg-[#F2F2F7] text-[#8E8E93]" 
                          : "bg-[#3A7BD5] text-white shadow-xl shadow-[#3A7BD5]/25" 
                        : "bg-white text-[#5C5C60] border border-[#E5E5E1] shadow-sm" 
                    )}>
                      {!isAvailable ? (
                        <Lock className="h-7 w-7" />
                      ) : isRead ? (
                        <MailOpen className="h-7 w-7" />
                      ) : (
                        <Mail className="h-7 w-7" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className={cn(
                        "font-black text-sm line-clamp-1 px-2 transition-colors tracking-tight",
                        isAvailable 
                          ? isRead ? "text-[#8E8E93]" : "text-[#2C2C2E]"
                          : "text-[#5C5C60]"
                      )}>
                        {isAvailable ? letter.title : "비밀의 편지"}
                      </h3>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isAvailable 
                          ? isRead ? "text-[#C7C7CC]" : "text-[#8E8E93]"
                          : "text-[#3A7BD5]"
                      )}>
                        {isAvailable 
                          ? format(new Date(letter.created_at), "yyyy. MM. dd")
                          : format(new Date(letter.open_at), "yyyy. MM. dd 공개")
                        }
                      </p>
                    </div>

                    {isAvailable && !isRead && (
                      <span className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#FF6B6B] rounded-full ring-4 ring-white animate-pulse" />
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Write Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-[#2C2C2E]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsWriteModalOpen(false)}>
          <div className="bg-white w-full max-w-xl flex flex-col overflow-hidden shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300 relative border border-white/20" onClick={(e) => e.stopPropagation()}>
            <header className="p-10 border-b border-[#E5E5E1] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3A7BD5] to-[#00D2FF]" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#3A7BD5]/10 flex items-center justify-center text-[#3A7BD5]">
                    <PenLine className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-black text-[#8E8E93] uppercase tracking-widest">Time Capsule</span>
                </div>
                <button onClick={() => setIsWriteModalOpen(false)} className="p-2.5 hover:bg-[#F5F5F7] rounded-full transition-all border border-transparent hover:border-[#E5E5E1] shadow-none hover:shadow-sm">
                  <X className="h-5 w-5 text-[#8E8E93]" />
                </button>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black text-[#2C2C2E] tracking-tight">몇 년 뒤의 나에게 보낼까요?</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <button key={year} onClick={() => setSelectedYears(year)} className={cn("flex-1 h-12 rounded-xl text-sm font-black transition-all border", selectedYears === year ? "bg-[#3A7BD5] text-white border-[#3A7BD5] shadow-lg shadow-[#3A7BD5]/20" : "bg-white text-[#8E8E93] border-[#E5E5E1] hover:border-[#3A7BD5]/30")}>
                      {year}년 뒤
                    </button>
                  ))}
                </div>
              </div>
            </header>
            <div className="p-10 pb-0 space-y-5">
              <input type="text" placeholder="편지 제목을 입력하세요" className="w-full border-none focus-visible:ring-0 text-2xl font-black p-0 bg-transparent placeholder:text-[#E5E5E1] tracking-tight text-[#2C2C2E]" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="h-px bg-[#E5E5E1]/50" />
            </div>
            <div className="p-10 pt-4">
              <Textarea placeholder="미래의 당신에게 전하고 싶은 이야기를 적어보세요..." className="w-full border-none focus-visible:ring-0 text-lg min-h-[350px] p-0 bg-transparent placeholder:text-[#E5E5E1] placeholder:text-lg leading-relaxed resize-none scrollbar-hide font-medium text-[#2C2C2E]" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <footer className="p-10 pt-0 flex items-center justify-between mt-auto">
              <p className="text-[11px] font-black text-[#8E8E93] uppercase tracking-widest">Ink on paper: {content.length} chars</p>
              <Button onClick={handleSaveLetter} className="bg-[#3A7BD5] hover:bg-[#2C5EAB] text-white h-14 rounded-2xl px-12 gap-3 shadow-xl shadow-[#3A7BD5]/20 border-none font-black text-base transition-all" disabled={!content.trim() || !title.trim()}>
                봉인하기 <Check className="h-4 w-4" />
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* Read Modal - Physical Letter Aesthetic (Vertical Rectangle) */}
      {selectedLetter && (
        <div className="fixed inset-0 bg-[#2C2C2E]/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLetter(null)}>
          <div className="bg-white w-full max-w-md flex flex-col overflow-hidden shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300 relative border border-white/20 min-h-[70vh] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <header className="p-10 pb-4 flex flex-col relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">Opened</span>
                  <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-widest">미래에서 도착한 편지</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleShareClick(selectedLetter)}
                    className="p-2.5 hover:bg-[#F5F5F7] rounded-full transition-all border border-transparent hover:border-[#E5E5E1] text-[#3A7BD5]"
                    title="공유하기"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button onClick={() => setSelectedLetter(null)} className="p-2.5 hover:bg-[#F5F5F7] rounded-full transition-all border border-transparent hover:border-[#E5E5E1]">
                    <X className="h-5 w-5 text-[#8E8E93]" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-1 bg-[#3A7BD5]/20 mb-4" />
                <p className="text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.3em]">Dear. Future Me</p>
                <h2 className="text-2xl font-black text-[#2C2C2E] tracking-tighter leading-tight">
                  {selectedLetter.title}
                </h2>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 pt-6 space-y-2 relative scrollbar-hide">
              {/* Lined Paper Effect */}
              <div className="absolute inset-x-10 top-6 bottom-10 flex flex-col pointer-events-none opacity-[0.15]">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="border-b border-[#E5E5E1] h-10 w-full" />
                ))}
              </div>
              
              <p className="text-[#2C2C2E] text-lg leading-[2.2] font-medium whitespace-pre-wrap tracking-tight relative z-10">
                {selectedLetter.content}
              </p>

              <div className="pt-10 pb-10 flex flex-col items-end gap-1 relative z-10 w-full">
                <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Sincerely.</p>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs font-bold text-[#3A7BD5]">{format(new Date(selectedLetter.created_at), "yyyy. MM. dd")}</span>
                  <span className="text-[10px] font-black text-[#2C2C2E] tracking-tighter italic">미래의 조각</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Preview Modal (Stationery Layout with Platinum Colors) */}
      {sharingData && (
        <div className="fixed inset-0 bg-[#2C2C2E]/80 backdrop-blur-md z-[130] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
            
            {/* Letter Paper Area */}
            <div 
              ref={cardRef}
              className="w-full aspect-[3/4] bg-white p-10 shadow-2xl flex flex-col relative overflow-hidden border border-[#E5E5E1]"
              style={{ minHeight: '480px' }}
            >
              <header className="mb-10 relative">
                <div className="w-12 h-1 bg-[#3A7BD5]/20 mb-6" />
                <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mb-3">Dear. Future Me</p>
                <h4 className="text-xl font-black text-[#2C2C2E] leading-tight">
                  {sharingData.title}
                </h4>
              </header>

              <div className="flex-1 relative">
                <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-[0.2] pointer-events-none">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-px bg-[#E5E5E1] w-full" />
                  ))}
                </div>
                <p className="text-[#2C2C2E] text-base leading-[2.2] font-medium relative z-10">
                  {sharingData.content}
                </p>
              </div>

              <footer className="mt-10 flex flex-col items-end gap-1 relative">
                <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Sincerely.</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-[#3A7BD5]">{format(new Date(sharingData.created_at), "yyyy. MM. dd")}</span>
                  <span className="text-[10px] font-black text-[#2C2C2E] tracking-tighter italic">미래의 조각</span>
                </div>
              </footer>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
              <Button 
                onClick={() => setSharingData(null)}
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
                  {isSharing ? "..." : "카톡"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
