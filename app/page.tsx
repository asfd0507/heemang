import { redirect } from "next/navigation";

export default function Home() {
  // 초기 접근 시 대시보드로 리다이렉트 (실제로는 로그인 체크 로직이 들어갈 자리)
  redirect("/dashboard");
}
