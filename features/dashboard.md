---

# features/dashboard.md

```md
# Dashboard 기능 명세

## 목적

사용자가 오늘의 질문과 기록 상태를 확인한다.

---

# 메인 구성

## 상단 헤더

- 서비스 로고
- 현재 몇 년차 표시
- 설정 버튼

---

## 오늘의 질문 카드

답변 전:

- 질문 표시
- textarea
- 저장 버튼

답변 후:

- 질문 숨김
- 완료 메시지 표시

---

# 질문 규칙

## DAILY

하루 1개

## WEEKLY

주 1개

## MONTHLY

월 1개

---

# 답변 정책

- 수정 불가
- 삭제 불가
- 중복 작성 불가

---

# 테이블

## questions

```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  frequency text not null,
  sequence_number int not null,
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
```
