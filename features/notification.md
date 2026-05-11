---

# features/notification.md

```md
# Notification 기능 명세

## 목적

사용자가 질문 작성 시기를 놓치지 않게 한다.

---

# 채널

## MVP

- 이메일

## 추후

- 웹푸시

---

# 이메일 종류

## DAILY

- 오늘 질문 알림
- 마감 전 알림

## WEEKLY

- 주간 리마인드

## MONTHLY

- 월간 리마인드

---

# 기술 스택

- Resend
- Supabase Cron

---

# 완료 기준

- 이메일 발송 가능
- 주기별 스케줄 가능
