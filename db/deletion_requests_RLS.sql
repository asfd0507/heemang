alter table deletion_requests enable row level security;

create policy "Users can view own deletion request"
on deletion_requests
for select
using (auth.uid() = user_id);

create policy "Users can create own deletion request"
on deletion_requests
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own deletion request"
on deletion_requests
for delete
using (auth.uid() = user_id);