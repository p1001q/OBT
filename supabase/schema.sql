-- OBT 스키마: 테이블, 제약조건, 인덱스, RLS
-- Supabase 대시보드의 SQL Editor에서 실행한다. 여러 번 실행해도 안전하다.
-- RPC 함수는 functions.sql, 관리자 비밀번호 설정은 seed-admin.sql.example 참고.

create extension if not exists pgcrypto with schema extensions;

-- 학기 명단. 같은 이름의 행이 여러 개일 수 있으며, 각 행이 한 명의 자리다.
-- student_id는 관리자가 명단을 넣을 때 같은 사람의 중복 등록을 막는 데만 쓴다.
-- 사용자 화면과 공개 RPC에는 노출하지 않는다.
create table if not exists public.roster (
  id         uuid primary key default gen_random_uuid(),
  name       text not null
             check (char_length(name) between 1 and 30 and name = btrim(name)),
  created_at timestamptz not null default now()
);

alter table public.roster
  add column if not exists student_id text check (student_id ~ '^[0-9]{5,20}$');

-- 같은 학번은 한 번만 등록할 수 있다. 학번이 없는 행은 제한하지 않는다.
create unique index if not exists roster_student_id_key
  on public.roster (student_id) where student_id is not null;

-- 상태를 처음 누를 때 생성되는 날짜별 입장자. day는 KST 기준 날짜다.
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  roster_id    uuid not null references public.roster (id) on delete cascade,
  name         text not null
               check (char_length(name) between 1 and 30),
  day          date not null,
  client_nonce uuid not null,
  created_at   timestamptz not null default now(),
  unique (roster_id, day),
  unique (day, client_nonce)
);

-- 탑승 계획(planned)과 현재 위치(location)는 독립된 두 축이다.
-- location이 null이면 동방도 아니고 보드를 타는 중도 아니다.
create table if not exists public.statuses (
  member_id  uuid primary key references public.members (id) on delete cascade,
  planned    boolean not null default false,
  location   text check (location in ('in_room', 'riding')),
  updated_at timestamptz not null default now()
);

-- admin_password_hash 등 서버 설정
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

-- 이름으로 명단을 찾는 register / check_name 용
create index if not exists roster_name_idx on public.roster (name);

-- 입장자 조회는 unique (day, client_nonce)와 unique (roster_id, day)의 인덱스가 담당한다.

-- 테이블 직접 접근 차단: RLS를 켜고 정책을 만들지 않으며 권한도 회수한다.
-- 접근은 SECURITY DEFINER RPC(functions.sql)로만 허용한다.
alter table public.roster       enable row level security;
alter table public.members      enable row level security;
alter table public.statuses     enable row level security;
alter table public.app_settings enable row level security;

revoke all on table public.roster, public.members, public.statuses, public.app_settings
  from anon, authenticated;

-- 이후 만들어지는 테이블도 기본으로는 접근할 수 없게 한다.
alter default privileges in schema public revoke all on tables from anon, authenticated;
