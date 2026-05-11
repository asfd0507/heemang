create table diary_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  duration_years int not null,
  frequency text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  locked boolean default true,
  created_at timestamptz default now()
);