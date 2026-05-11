create table answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  question_id uuid references questions(id),
  plan_id uuid references diary_plans(id),

  cycle_year int not null,
  answer_date timestamptz not null,
  content text not null,

  created_at timestamptz default now()
);