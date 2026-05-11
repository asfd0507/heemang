# Settings 기능 명세

## 목적

계정과 알림 설정을 관리한다.

---

# 기능

- 로그아웃
- 알림 설정
- 탈퇴 신청
- 탈퇴 취소

---

# 탈퇴 정책

- 신청 후 30일 유예
- 로그인 시 복구 가능
- 30일 후 완전 삭제

---

# 테이블

## deletion_requests

```sql
create table deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  scheduled_delete_at timestamptz not null,
  created_at timestamptz default now()
);
```
