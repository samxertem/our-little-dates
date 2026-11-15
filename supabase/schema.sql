-- ✿ our little dates — the shared board ✿
-- Run once in the Supabase SQL editor (safe to re-run).
--
-- How it's protected: every device signs in anonymously (no passwords), and a device
-- can only read or write a board it has joined with the board's invite code. The
-- publishable key inside the app can't get around this; only these rules decide.

-- ---------- tables ----------
create table if not exists public.boards (
  id              uuid primary key default gen_random_uuid(),
  invite_code     text not null unique,
  meta            jsonb not null default '{}'::jsonb,   -- names, season setting, mochi's pets
  meta_updated_at bigint not null default 0,            -- device clock (ms) of the last meta change
  created_at      timestamptz not null default now()
);

create table if not exists public.board_members (
  board_id  uuid not null references public.boards (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

-- One row per date idea. Deleting only sets `deleted`, so the other phone hears about it too.
create table if not exists public.ideas (
  board_id   uuid not null references public.boards (id) on delete cascade,
  id         text not null check (id ~ '^[a-z0-9]{4,40}$'),
  data       jsonb not null,
  deleted    boolean not null default false,
  synced_at  timestamptz not null default now(),        -- server time: "what changed since I last looked?"
  updated_by uuid,
  primary key (board_id, id)
);
create index if not exists ideas_board_synced on public.ideas (board_id, synced_at);

-- the server stamps who/when, so a device can't fake it
create or replace function public.stamp_idea() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.synced_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;
drop trigger if exists stamp_idea on public.ideas;
create trigger stamp_idea before insert or update on public.ideas
  for each row execute function public.stamp_idea();

-- ---------- who's on which board ----------
-- security definer so the policies below can ask without tripping over their own rules
create or replace function public.is_board_member(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.board_members m
    where m.board_id = b and m.user_id = (select auth.uid())
  );
$$;

-- same question for a storage path like "<board id>/<photo>.jpg" (never errors on odd names)
create or replace function public.is_board_member_path(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.board_members m
    where m.board_id::text = split_part(object_name, '/', 1) and m.user_id = (select auth.uid())
  );
$$;

-- ---------- row level security ----------
alter table public.boards        enable row level security;
alter table public.board_members enable row level security;
alter table public.ideas         enable row level security;

drop policy if exists "members see their board" on public.boards;
create policy "members see their board" on public.boards
  for select to authenticated using (public.is_board_member(id));
drop policy if exists "members change their board" on public.boards;
create policy "members change their board" on public.boards
  for update to authenticated using (public.is_board_member(id)) with check (public.is_board_member(id));

drop policy if exists "members see each other" on public.board_members;
create policy "members see each other" on public.board_members
  for select to authenticated using (public.is_board_member(board_id));
drop policy if exists "a device can leave" on public.board_members;
create policy "a device can leave" on public.board_members
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "members read ideas" on public.ideas;
create policy "members read ideas" on public.ideas
  for select to authenticated using (public.is_board_member(board_id));
drop policy if exists "members add ideas" on public.ideas;
create policy "members add ideas" on public.ideas
  for insert to authenticated with check (public.is_board_member(board_id));
drop policy if exists "members change ideas" on public.ideas;
create policy "members change ideas" on public.ideas
  for update to authenticated using (public.is_board_member(board_id)) with check (public.is_board_member(board_id));

-- New tables aren't exposed automatically on this project, so say exactly what the app may do.
-- (boards: only meta is editable; ideas: never hard-deleted.)
revoke all on public.boards, public.board_members, public.ideas from anon, authenticated;
grant select on public.boards to authenticated;
grant update (meta, meta_updated_at) on public.boards to authenticated;
grant select, delete on public.board_members to authenticated;
grant select, insert, update on public.ideas to authenticated;

-- ---------- making + joining a board ----------
-- Codes look like MOCHI-7K3Q-X9PA: 8 characters from 32 easy-to-read ones (no 0/O, 1/I)
-- = about a trillion possibilities, so nobody stumbles onto your board by guessing.
create or replace function public.new_invite_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  code text := '';
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    if i = 3 then code := code || '-'; end if;
  end loop;
  return 'MOCHI-' || code;
end $$;

create or replace function public.create_board(board_meta jsonb default '{}'::jsonb)
returns table (board_id uuid, invite_code text)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  me uuid := (select auth.uid());
  b uuid;
  code text;
begin
  if me is null then raise exception 'not signed in'; end if;
  loop
    code := public.new_invite_code();
    begin
      insert into public.boards (invite_code, meta) values (code, coalesce(board_meta, '{}'::jsonb)) returning id into b;
      exit;
    exception when unique_violation then -- astronomically unlikely; just roll again
    end;
  end loop;
  insert into public.board_members (board_id, user_id) values (b, me);
  return query select b, code;
end $$;

-- A board is for two people, but each of you may have a phone, a tablet and the computer.
create or replace function public.join_board(code text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  b uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  select id into b from public.boards
  where invite_code = upper(regexp_replace(coalesce(code, ''), '\s', '', 'g'));
  if b is null then raise exception 'no board with that code'; end if;
  if not exists (select 1 from public.board_members where board_id = b and user_id = me)
     and (select count(*) from public.board_members where board_id = b) >= 8 then
    raise exception 'that board already has 8 devices';
  end if;
  insert into public.board_members (board_id, user_id) values (b, me) on conflict do nothing;
  return b;
end $$;

revoke all on function public.new_invite_code(), public.create_board(jsonb), public.join_board(text),
  public.is_board_member(uuid), public.is_board_member_path(text) from public, anon;
grant execute on function public.create_board(jsonb), public.join_board(text),
  public.is_board_member(uuid), public.is_board_member_path(text) to authenticated;

-- ---------- photos ----------
-- Private bucket; files live at "<board id>/<name>.jpg". Photos are never changed or deleted
-- from the app (same promise as on the computer: a memory is never lost by accident).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "members see board photos" on storage.objects;
create policy "members see board photos" on storage.objects
  for select to authenticated using (bucket_id = 'photos' and public.is_board_member_path(name));
drop policy if exists "members add board photos" on storage.objects;
create policy "members add board photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'photos'
    and name ~ '^[0-9a-f-]{36}/[a-z0-9-]+\.jpg$'
    and public.is_board_member_path(name)
  );

-- ---------- live updates ----------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ideas') then
    alter publication supabase_realtime add table public.ideas;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'boards') then
    alter publication supabase_realtime add table public.boards;
  end if;
end $$;
