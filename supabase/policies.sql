alter table profiles enable row level security;
alter table diary_plans enable row level security;
alter table answers enable row level security;
alter table deletion_requests enable row level security;

create policy "profile_select"
on profiles
for select
using (auth.uid() = id);

create policy "profile_insert"
on profiles
for insert
with check (auth.uid() = id);

create policy "diary_plan_select"
on diary_plans
for select
using (auth.uid() = user_id);

create policy "diary_plan_insert"
on diary_plans
for insert
with check (auth.uid() = user_id);

create policy "answer_select"
on answers
for select
using (auth.uid() = user_id);

create policy "answer_insert"
on answers
for insert
with check (auth.uid() = user_id);

create policy "deletion_select"
on deletion_requests
for select
using (auth.uid() = user_id);

create policy "deletion_insert"
on deletion_requests
for insert
with check (auth.uid() = user_id);