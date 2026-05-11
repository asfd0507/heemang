import { OnboardingForm } from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            반가워요!
          </h1>
          <p className="text-muted-foreground">
            당신의 기록을 담을 타임캡슐을 만들어볼까요?
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
