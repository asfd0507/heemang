"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";

export function Navbar() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#D2D2D7]/30">
      <div className="container mx-auto max-w-4xl h-16 px-4 md:px-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 bg-[#4A90E2] rounded-lg flex items-center justify-center text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-black text-[#1D1D1F] tracking-tight">희망</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-[#86868B] hover:text-[#E03E3E] hover:bg-red-50 rounded-full gap-2 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline font-medium">로그아웃</span>
        </Button>
      </div>
    </nav>
  );
}
