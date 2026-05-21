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
    const fetchNewLettersCount = async (userId: string) => {
      const { count, error } = await supabase
        .from("future_letters")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .lte("open_at", new Date().toISOString());
      
      if (!error) {
        setHasNewLetters(Boolean(count && count > 0));
      }
    };

    const getUserInfo = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchNewLettersCount(currentUser.id);
      }
    };

    getUserInfo();

    const handleLetterRead = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await fetchNewLettersCount(currentUser.id);
      }
    };

    window.addEventListener("letterRead", handleLetterRead);
    return () => window.removeEventListener("letterRead", handleLetterRead);
  }, [supabase, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-[#E5E5E1]">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => router.push("/")}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#3A7BD5] to-[#00D2FF] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#3A7BD5]/20 group-hover:scale-105 transition-all">
              <Sparkles className="h-4 w-4 fill-white/20" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black text-[#2C2C2E] block leading-none tracking-tight">미래의 조각</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#F5F5F7]/40 p-1 rounded-xl border border-[#D2D2D7]/20">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
              className={cn(
                "h-8 rounded-lg px-4 text-xs font-bold gap-2 transition-all",
                pathname === "/dashboard" ? "bg-white text-[#3A7BD5] shadow-sm" : "text-[#8E8E93] hover:text-[#2C2C2E]"
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
                pathname === "/letters" ? "bg-white text-[#3A7BD5] shadow-sm" : "text-[#8E8E93] hover:text-[#2C2C2E]"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>편지함</span>
              {hasNewLetters && (
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[#FF6B6B] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </Button>
          </div>
        </div>

        {/* Right: User & Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-[#8E8E93] font-bold leading-none mb-1">안녕하세요</p>
              <p className="text-xs font-black text-[#2C2C2E]">
                <span className="text-[#3A7BD5]">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>님
              </p>
            </div>
          )}
          <div className="h-6 w-px bg-[#D2D2D7]/30 hidden md:block mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="h-9 px-3 rounded-lg text-[#8E8E93] hover:text-[#FF6B6B] hover:bg-red-50 transition-colors gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline text-xs font-black">로그아웃</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
