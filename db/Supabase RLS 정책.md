# 완료 기준

- 탈퇴 신청 가능
- 탈퇴 취소 가능
- 삭제 예정일 표시
- 30일 이후 자동 삭제 가능

---

# Supabase RLS 정책

## diary_plans

```sql
alter table diary_plans enable row level security;

create policy "Users can view own diary plan"
on diary_plans
for select
using (auth.uid() = user_id);

create policy "Users can insert own diary plan"
on diary_plans
for insert
with check (auth.uid() = user_id);
```
