"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const onboardingSchema = z.object({
  period: z.number().min(2).max(5),
  frequency: z.enum(["daily", "weekly", "monthly"]),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      period: 3,
      frequency: "daily",
    },
  });

  const period = form.watch("period");
  const frequency = form.watch("frequency");

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = (data: OnboardingValues) => {
    console.log("Onboarding Data:", data);
    // 선택한 설정을 로컬 스토리지에 임시 저장 (DB 연동 전까지 UI 테스트용)
    if (typeof window !== "undefined") {
      localStorage.setItem("diary_settings", JSON.stringify(data));
    }
    router.push("/dashboard");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mac-card p-8 md:p-10 space-y-8">
        {/* Apple-style Progress dots */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                step === i ? "bg-[#007AFF] w-4" : "bg-[#D2D2D7]"
              )}
            />
          ))}
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">기록 기간 선택</h1>
                <p className="text-[#86868B] text-sm">얼마나 오랫동안 당신의 이야기를 담을까요?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[2, 3, 4, 5].map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => form.setValue("period", year)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200",
                      period === year
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] ring-1 ring-[#007AFF]"
                        : "border-[#D2D2D7]/50 bg-[#F5F5F7]/50 hover:bg-[#E8E8ED]"
                    )}
                  >
                    <span className="text-xl font-semibold">{year}년</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">답변 주기 선택</h1>
                <p className="text-[#86868B] text-sm">어떤 간격으로 질문을 보내드릴까요?</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: "daily", label: "매일 한 번", desc: "하루를 차분히 정리합니다" },
                  { id: "weekly", label: "매주 한 번", desc: "한 주의 흐름을 기록합니다" },
                  { id: "monthly", label: "매달 한 번", desc: "한 달의 성장을 되돌아봅니다" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => form.setValue("frequency", item.id as any)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 text-left",
                      frequency === item.id
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] ring-1 ring-[#007AFF]"
                        : "border-[#D2D2D7]/50 bg-[#F5F5F7]/50 hover:bg-[#E8E8ED]"
                    )}
                  >
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        frequency === item.id ? "text-[#007AFF]/80" : "text-[#86868B]"
                      )}>{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">최종 확인</h1>
                <p className="text-[#86868B] text-sm">설정하신 내용은 미래의 당신에게 전달될 약속입니다.</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-2xl p-6 space-y-4 border border-[#D2D2D7]/30">
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-[#86868B]">기록 기간</span>
                  <span className="text-lg font-bold">{period}년</span>
                </div>
                <div className="h-px bg-[#D2D2D7]/30 mx-2" />
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-[#86868B]">답변 주기</span>
                  <span className="text-lg font-bold">
                    {frequency === "daily" ? "매일" : frequency === "weekly" ? "매주" : "매달"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100 select-none cursor-pointer" onClick={() => setIsConfirmed(!isConfirmed)}>
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-all",
                  isConfirmed ? "bg-[#E03E3E] border-[#E03E3E]" : "border-[#D2D2D7] bg-white"
                )}>
                  {isConfirmed && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <p className="text-xs text-[#E03E3E] font-bold leading-tight">
                  설정하신 내용은 이후 <span className="underline">변경할 수 없음에 동의합니다.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              className="flex-1 h-12 rounded-full border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/5 font-semibold transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
          )}
          <Button
            type={step === 3 ? "submit" : "button"}
            onClick={step === 3 ? undefined : nextStep}
            disabled={step === 3 && !isConfirmed}
            className="flex-[2] h-12 rounded-full bg-[#007AFF] text-white hover:bg-[#0071E3] font-semibold transition-all shadow-md shadow-[#007AFF]/20 gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {step === 1 ? "다음 단계" : step === 2 ? "선택 완료" : "타임캡슐 시작하기"}
            {step !== 3 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
