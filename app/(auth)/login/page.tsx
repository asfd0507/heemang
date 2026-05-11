"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="pt-12 pb-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#3A7BD5]/10 rounded-2xl flex items-center justify-center text-[#FFD54F] animate-bounce shadow-inner">
            <Sparkles className="h-8 w-8 fill-current" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black text-[#1D1D1F] tracking-tight">
              미래의 조각
            </CardTitle>
            <CardDescription className="text-base font-medium text-[#86868B]">
              오늘의 기록이 미래의 선물이 됩니다.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-12 px-8 space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-sm text-[#86868B] leading-relaxed">
              같은 질문에 매년 답하며<br />
              당신의 변화와 성장을 기록해보세요.
            </p>
          </div>
          
          <Button 
            onClick={handleKakaoLogin}
            className="w-full h-14 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-bold rounded-2xl border-none shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            {/* 카카오 로고 대신 간단한 원형 아이콘 */}
            <div className="w-6 h-6 bg-[#191919] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-[#FEE500] rounded-full" />
            </div>
            카카오로 시작하기
          </Button>

          <p className="text-[11px] text-center text-[#D2D2D7] font-medium uppercase tracking-widest">
            By continuing, you agree to our Terms of Service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
