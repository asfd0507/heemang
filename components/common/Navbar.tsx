"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [hasNewLetters, setHasNewLetters] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 열 수 있으면서 아직 읽지 않은 편지가 있는지 확인
        const { count } = await supabase
          .from("future_letters")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
          .lte("open_at", new Date().toISOString());
        
        setHasNewLetters(Boolean(count && count > 0));
      }
    };
    getUser();
  }, [supabase, pathname]); // pathname 추가해서 페이지 이동시마다 체크

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-4xl">
      <div className="bg-white/90 backdrop-blur-xl border border-[#D2D2D7]/40 shadow-xl shadow-black/5 rounded-2xl px-5 h-16 flex items-center justify-between">
        
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#3A7BD5] to-[#00D2FF] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#3A7BD5]/25 group-hover:scale-105 transition-all">
              <Sparkles className="h-5 w-5 fill-white/20" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black text-[#1D1D1F] block leading-none tracking-tight">미래의 조각</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F5F5F7]/80 p-1 rounded-xl border border-[#D2D2D7]/20">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
              className={cn(
                "h-8 rounded-lg px-4 text-xs font-bold gap-2 transition-all",
                pathname === "/dashboard" ? "bg-white text-[#3A7BD5] shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>기록</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/letters")}
              className={cn(
                "h-8 rounded-lg px-4 text-xs font-bold gap-2 transition-all relative",
                pathname === "/letters" ? "bg-white text-[#3A7BD5] shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>편지함</span>
              {hasNewLetters && (
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[#E03E3E] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </Button>
          </div>
        </div>

        {/* Right: User & Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:block text-right">
              <p className="text-[11px] text-[#86868B] font-bold leading-none mb-1">안녕하세요</p>
              <p className="text-xs font-black text-[#1D1D1F]">
                <span className="text-[#3A7BD5]">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>님
              </p>
            </div>
          )}
          <div className="h-8 w-px bg-[#D2D2D7]/30 hidden md:block mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="h-10 px-3 md:px-4 rounded-xl text-[#86868B] hover:text-[#E03E3E] hover:bg-red-50 transition-colors gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline text-xs font-black">로그아웃</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
