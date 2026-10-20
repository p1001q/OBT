-- OBT RPC 함수. schema.sql 실행 후 SQL Editor에서 실행한다. 여러 번 실행해도 안전하다.
-- 모든 함수는 SECURITY DEFINER이며 search_path를 비워 두고 스키마를 명시한다.
-- 오류는 `raise exception '<코드>'`로 던지며, 프론트는 message 값(코드)으로 분기한다.
--   NAME_NOT_FOUND, NAME_SLOTS_FULL, MEMBER_NOT_FOUND, MEMBER_EXPIRED,
--   INVALID_STATUS, INVALID_REQUEST, ADMIN_UNAUTHORIZED

-- ───────────────────────── 내부 함수 (클라이언트에 공개하지 않음) ─────────────────────────

create or replace function public.kst_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Seoul')::date
$$;

-- 오늘의 입장자인지 검증한다.
create or replace function public.assert_today_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date;
begin
  select m.day into v_day from public.members m where m.id = p_member_id;
  if not found then
    raise exception 'MEMBER_NOT_FOUND';
  end if;
  if v_day <> public.kst_today() then
    raise exception 'MEMBER_EXPIRED';
  end if;
end;
$$;

-- 관리자 비밀번호를 검증한다. 설정이 없거나 빈 비밀번호면 항상 실패한다.
create or replace function public.admin_check(p_pw text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  select s.value into v_hash from public.app_settings s where s.key = 'admin_password_hash';
  if v_hash is null or p_pw is null or p_pw = '' or extensions.crypt(p_pw, v_hash) <> v_hash then
    raise exception 'ADMIN_UNAUTHORIZED';
  end if;
end;
$$;

-- ───────────────────────── 사용자 RPC ─────────────────────────

-- 이름이 명단에 있는지와 서버의 오늘 날짜를 반환한다. DB에는 아무것도 만들지 않는다.
create or replace function public.check_name(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  return jsonb_build_object(
    'found', v_name <> '' and exists (select 1 from public.roster r where r.name = v_name),
    'day', public.kst_today()
  );
end;
$$;

-- 현황판을 반환한다. 실제 member_id와 client_nonce는 포함하지 않는다.
-- p_member_id가 오늘의 입장자가 아니면 me는 null이다(프론트는 로컬 입장자 ID를 제거하면 된다).
create or replace function public.get_board(p_member_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := public.kst_today();
  v_me jsonb;
  v_result jsonb;
begin
  if p_member_id is not null then
    select jsonb_build_object('planned', coalesce(s.planned, false), 'location', s.location)
      into v_me
      from public.members m
      left join public.statuses s on s.member_id = m.id
     where m.id = p_member_id and m.day = v_today;
  end if;

  with today as (
    select m.id,
           m.created_at,
           s.planned,
           s.location,
           jsonb_build_object(
             'name', m.name,
             'seed', substr(md5('obt:' || m.id::text), 1, 8),
             'is_me', coalesce(m.id = p_member_id, false)
           ) as item
      from public.members m
      join public.statuses s on s.member_id = m.id
     where m.day = v_today
       and (s.planned or s.location is not null)
  )
  select jsonb_build_object(
           'day', v_today,
           'planned',  coalesce(jsonb_agg(item order by created_at, id) filter (where planned), '[]'::jsonb),
           'in_room',  coalesce(jsonb_agg(item order by created_at, id) filter (where location = 'in_room'), '[]'::jsonb),
           'riding',   coalesce(jsonb_agg(item order by created_at, id) filter (where location = 'riding'), '[]'::jsonb),
           'counts', jsonb_build_object(
             'planned', count(*) filter (where planned),
             'in_room', count(*) filter (where location = 'in_room'),
             'riding',  count(*) filter (where location = 'riding')
           ),
           'me', v_me
         )
    into v_result
    from today;

  return v_result;
end;
$$;

-- 오늘의 명단 빈자리를 원자적으로 배정하고 입장자 ID를 반환한다.
-- 같은 날짜와 p_client_nonce로 재호출하면 기존 결과를 반환한다.
create or replace function public.register(p_name text, p_client_nonce uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_today date := public.kst_today();
  v_member public.members%rowtype;
  v_roster_id uuid;
  v_slots int;
begin
  if p_client_nonce is null then
    raise exception 'INVALID_REQUEST';
  end if;
  if char_length(v_name) not between 1 and 30 then
    raise exception 'NAME_NOT_FOUND';
  end if;

  -- 같은 이름의 등록 요청을 직렬화한다.
  perform pg_advisory_xact_lock(hashtextextended(v_name, 0));

  select * into v_member
    from public.members m
   where m.day = v_today and m.client_nonce = p_client_nonce;
  if found then
    if v_member.name = v_name then
      return jsonb_build_object('member_id', v_member.id, 'day', v_today);
    end if;
    raise exception 'INVALID_REQUEST';
  end if;

  select count(*) into v_slots from public.roster r where r.name = v_name;
  if v_slots = 0 then
    raise exception 'NAME_NOT_FOUND';
  end if;

  select r.id into v_roster_id
    from public.roster r
   where r.name = v_name
     and not exists (
       select 1 from public.members m where m.roster_id = r.id and m.day = v_today
     )
   order by r.created_at, r.id
   limit 1;

  if v_roster_id is null then
    -- 자리가 한 개뿐이면 기존 오늘 입장자를 돌려준다(브라우저 데이터 삭제 복구용).
    if v_slots = 1 then
      select m.* into v_member
        from public.members m
        join public.roster r on r.id = m.roster_id
       where r.name = v_name and m.day = v_today;
      return jsonb_build_object('member_id', v_member.id, 'day', v_today);
    end if;
    raise exception 'NAME_SLOTS_FULL';
  end if;

  insert into public.members (roster_id, name, day, client_nonce)
  values (v_roster_id, v_name, v_today, p_client_nonce)
  returning * into v_member;

  insert into public.statuses (member_id) values (v_member.id);

  return jsonb_build_object('member_id', v_member.id, 'day', v_today);
end;
$$;

create or replace function public.set_planned(p_member_id uuid, p_on boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.statuses%rowtype;
begin
  perform public.assert_today_member(p_member_id);
  if p_on is null then
    raise exception 'INVALID_STATUS';
  end if;

  insert into public.statuses as s (member_id, planned)
  values (p_member_id, p_on)
  on conflict (member_id) do update set planned = excluded.planned, updated_at = now()
  returning * into v_status;

  return jsonb_build_object('planned', v_status.planned, 'location', v_status.location);
end;
$$;

create or replace function public.set_location(p_member_id uuid, p_location text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.statuses%rowtype;
begin
  perform public.assert_today_member(p_member_id);
  if p_location is not null and p_location not in ('in_room', 'riding') then
    raise exception 'INVALID_STATUS';
  end if;

  insert into public.statuses as s (member_id, location)
  values (p_member_id, p_location)
  on conflict (member_id) do update set location = excluded.location, updated_at = now()
  returning * into v_status;

  return jsonb_build_object('planned', v_status.planned, 'location', v_status.location);
end;
$$;

-- 오늘의 본인 입장자와 상태를 삭제한다(이름 변경용).
create or replace function public.leave_today(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_today_member(p_member_id);
  delete from public.members m where m.id = p_member_id;
end;
$$;

-- ───────────────────────── 관리자 RPC ─────────────────────────

create or replace function public.admin_list(p_pw text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := public.kst_today();
begin
  perform public.admin_check(p_pw);

  return jsonb_build_object(
    'day', v_today,
    'roster', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'name', r.name, 'created_at', r.created_at, 'member_id', m.id
             ) order by r.created_at, r.id)
        from public.roster r
        left join public.members m on m.roster_id = r.id and m.day = v_today
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'roster_id', m.roster_id, 'name', m.name,
               'planned', coalesce(s.planned, false), 'location', s.location,
               'created_at', m.created_at
             ) order by m.created_at, m.id)
        from public.members m
        left join public.statuses s on s.member_id = m.id
       where m.day = v_today
    ), '[]'::jsonb),
    'summary', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.name, 'slots', t.slots, 'joined', t.joined) order by t.name)
        from (
          select r.name, count(distinct r.id) as slots, count(m.id) as joined
            from public.roster r
            left join public.members m on m.roster_id = r.id and m.day = v_today
           group by r.name
        ) t
    ), '[]'::jsonb)
  );
end;
$$;

-- 빈 줄을 제외하고 일괄 추가한다. 중복 이름을 허용하며, 입력 순서를 created_at에 반영한다.
-- 추가한 행 수를 반환한다.
create or replace function public.admin_add(p_pw text, p_names text[])
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  perform public.admin_check(p_pw);

  if p_names is null or cardinality(p_names) > 500 then
    raise exception 'INVALID_REQUEST';
  end if;
  if exists (select 1 from unnest(p_names) as n where char_length(btrim(n)) > 30) then
    raise exception 'INVALID_REQUEST';
  end if;

  insert into public.roster (name, created_at)
  select btrim(t.n), clock_timestamp() + t.o * interval '1 microsecond'
    from unnest(p_names) with ordinality as t(n, o)
   where btrim(t.n) <> '';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 명단 한 자리를 삭제한다. 연결된 입장자와 상태도 함께 삭제된다. 삭제한 행 수를 반환한다.
create or replace function public.admin_remove(p_pw text, p_roster_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  perform public.admin_check(p_pw);
  delete from public.roster r where r.id = p_roster_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 입장자 한 명과 상태를 삭제한다. 삭제한 행 수를 반환한다.
create or replace function public.admin_remove_member(p_pw text, p_member_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  perform public.admin_check(p_pw);
  delete from public.members m where m.id = p_member_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 명단과 모든 입장자·상태를 삭제한다.
-- Supabase의 API 역할은 WHERE 없는 DELETE를 거부하므로 `where true`를 명시한다.
create or replace function public.admin_reset(p_pw text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.admin_check(p_pw);
  delete from public.members where true;
  delete from public.roster where true;
end;
$$;

-- ───────────────────────── 실행 권한 ─────────────────────────
-- 함수는 기본적으로 PUBLIC에 실행 권한이 붙으므로 모두 회수한 뒤 필요한 것만 연다.

revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant execute on function
  public.check_name(text),
  public.get_board(uuid),
  public.register(text, uuid),
  public.set_planned(uuid, boolean),
  public.set_location(uuid, text),
  public.leave_today(uuid),
  public.admin_list(text),
  public.admin_add(text, text[]),
  public.admin_remove(text, uuid),
  public.admin_remove_member(text, uuid),
  public.admin_reset(text)
to anon, authenticated;
