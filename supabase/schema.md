create extension if not exists "pgcrypto";

create table profiles (
id uuid primary key references auth.users(id),
nickname text,
created_at timestamptz default now()
);

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

create table questions (
id uuid primary key default gen_random_uuid(),

frequency text not null,
sequence_number int not null,

content text not null,

is_active boolean default true,

created_at timestamptz default now()
);

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

create table deletion_requests (
id uuid primary key default gen_random_uuid(),

user_id uuid references auth.users(id),

scheduled_delete_at timestamptz not null,

created_at timestamptz default now()
);
