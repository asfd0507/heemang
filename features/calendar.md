---

# features/calendar.md

```md
# Calendar 기능 명세

## 목적

답변 기록 상태를 달력에서 시각적으로 표시한다.

---

# UI

- 월간 달력
- PC 우선
- hover 효과
- 클릭 가능 날짜 표시

---

# 상태 표시

## DAILY

답변 날짜만 체크

## WEEKLY

해당 주 전체 체크

## MONTHLY

해당 월 전체 체크

---

# 상태 종류

- ANSWERED
- SKIPPED
- FUTURE
- TODAY

---

# 디자인

## 답변 완료

- 노란 점
- 파란 체크

## 오늘

- 파란 테두리

## 스킵

- 연한 회색

---

# 완료 기준

- 월 이동 가능
- 상태 표시 가능
- 날짜 클릭 가능
