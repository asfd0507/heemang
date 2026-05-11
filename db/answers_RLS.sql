alter table answers enable row level security;

create policy "Users can view own answers"
on answers
for select
using (auth.uid() = user_id);

create policy "Users can insert own answers"
on answers
for insert
with check (auth.uid() = user_id);