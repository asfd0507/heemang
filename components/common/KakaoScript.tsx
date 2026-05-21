"use client";

import Script from "next/script";

export function KakaoScript() {
  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init("84fc52d1ac73cfa4e79dcbb774fae4d3");
        }
      }}
    />
  );
}

declare global {
  interface Window {
    Kakao: any;
  }
}
