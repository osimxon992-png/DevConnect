-- DevConnect schema. Run once in Supabase SQL Editor (Dashboard -> SQL -> New query).
-- Order: extensions, tables, helpers, triggers, RLS, storage, realtime, seed.

-- =========================================================
-- TABLES
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text,
  bio text default '' check (char_length(bio) <= 300),
  location text default '',
  level text not null default 'junior' check (level in ('beginner','junior','middle','senior','lead')),
  main_language text default '',
  languages text[] not null default '{}',
  github text default '',
  website text default '',
  is_private boolean not null default false,
  notification_prefs jsonb not null default '{}',
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.skills (
  id serial primary key,
  name text not null unique
);

create table public.user_skills (
  user_id uuid references public.profiles on delete cascade,
  skill_id int references public.skills on delete cascade,
  primary key (user_id, skill_id)
);

create table public.follows (
  follower_id uuid references public.profiles on delete cascade,
  following_id uuid references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 3 and 60),
  description text default '',
  image_url text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid references public.groups on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Feed posts and group posts share one table so likes/comments work the same; group_posts is a view below.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  group_id uuid references public.groups on delete cascade,
  content text not null default '' check (char_length(content) <= 5000),
  code text default '',
  language text default '',
  image_urls text[] not null default '{}',
  project_link text default '',
  likes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (char_length(content) > 0 or char_length(code) > 0 or cardinality(image_urls) > 0)
);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_group_idx on public.posts (group_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);

create view public.group_posts with (security_invoker = true) as
  select * from public.posts where group_id is not null;

create table public.post_likes (
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  title text not null check (char_length(title) between 10 and 200),
  description text not null check (char_length(description) <= 10000),
  code text default '',
  language text default '',
  status text not null default 'open' check (status in ('open','solved')),
  accepted_answer_id uuid,
  score int not null default 0,
  answers_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index questions_created_idx on public.questions (created_at desc);

create table public.question_tags (
  question_id uuid references public.questions on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9+#.\-]{1,30}$'),
  primary key (question_id, tag)
);
create index question_tags_tag_idx on public.question_tags (tag);

create table public.question_votes (
  question_id uuid references public.questions on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (question_id, user_id)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  content text not null check (char_length(content) between 1 and 10000),
  code text default '',
  score int not null default 0,
  created_at timestamptz not null default now()
);
create index answers_question_idx on public.answers (question_id);

alter table public.questions
  add constraint questions_accepted_fk foreign key (accepted_answer_id) references public.answers on delete set null;

create table public.answer_votes (
  answer_id uuid references public.answers on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (answer_id, user_id)
);

-- One comments table for posts, questions and answers; replies use parent_id (comment_replies view below).
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  post_id uuid references public.posts on delete cascade,
  question_id uuid references public.questions on delete cascade,
  answer_id uuid references public.answers on delete cascade,
  parent_id uuid references public.comments on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  likes_count int not null default 0,
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id, question_id, answer_id) = 1)
);
create index comments_post_idx on public.comments (post_id);
create index comments_question_idx on public.comments (question_id);
create index comments_answer_idx on public.comments (answer_id);
create index comments_parent_idx on public.comments (parent_id);

create view public.comment_replies with (security_invoker = true) as
  select * from public.comments where parent_id is not null;

create table public.comment_likes (
  comment_id uuid references public.comments on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  primary key (comment_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  image_url text,
  technologies text[] not null default '{}',
  github_url text default '',
  demo_url text default '',
  status text not null default 'idea' check (status in ('idea','looking','in_development','completed')),
  team_size int not null default 1 check (team_size between 1 and 100),
  required_roles text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index projects_owner_idx on public.projects (owner_id);

create table public.project_members (
  project_id uuid references public.projects on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  role text not null default 'Other',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.project_join_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role text not null default 'Other',
  message text default '',
  skills text[] not null default '{}',
  reason text default '',
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);
create unique index join_requests_one_pending on public.project_join_requests (project_id, user_id) where status = 'pending';

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid unique references public.projects on delete cascade,
  title text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid references public.conversations on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  actor_id uuid references public.profiles on delete cascade,
  type text not null,
  message text not null,
  link text not null default '/',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  company text not null,
  description text not null default '',
  requirements text default '',
  technologies text[] not null default '{}',
  salary text default '',
  location text default '',
  work_mode text not null default 'remote' check (work_mode in ('remote','onsite','hybrid')),
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','internship','freelance')),
  apply_url text not null check (apply_url ~ '^https?://'),
  created_at timestamptz not null default now()
);
create index jobs_created_idx on public.jobs (created_at desc);

create table public.saved_posts (
  user_id uuid references public.profiles on delete cascade,
  post_id uuid references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create table public.saved_questions (
  user_id uuid references public.profiles on delete cascade,
  question_id uuid references public.questions on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create table public.saved_projects (
  user_id uuid references public.profiles on delete cascade,
  project_id uuid references public.projects on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
create table public.saved_jobs (
  user_id uuid references public.profiles on delete cascade,
  job_id uuid references public.jobs on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles on delete cascade,
  target_type text not null check (target_type in ('user','post','comment','question','project','job')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','harassment','inappropriate','fake_account','scam','other')),
  details text default '',
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);

-- =========================================================
-- HELPERS (security definer so policies don't recurse)
-- =========================================================

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select not is_suspended from profiles where id = auth.uid()), false)
$$;

create function public.can_view_user(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select uid = auth.uid()
    or not (select is_private from profiles where id = uid)
    or exists (select 1 from follows where follower_id = auth.uid() and following_id = uid)
    or (select is_admin from profiles where id = auth.uid())
$$;

create function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid())
$$;

create function public.is_group_admin(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid() and role = 'admin')
$$;

create function public.is_project_owner(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects where id = pid and owner_id = auth.uid())
$$;

create function public.is_conversation_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from conversation_members where conversation_id = cid and user_id = auth.uid())
$$;

-- Inserts a notification unless the user is the actor or disabled this type in settings.
create function public.notify(target uuid, actor uuid, ntype text, msg text, href text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if target is null or target = actor then return; end if;
  if coalesce((select (notification_prefs ->> ntype)::boolean from profiles where id = target), true) then
    insert into notifications (user_id, actor_id, type, message, link) values (target, actor, ntype, msg, href);
  end if;
end $$;

create function public.uname(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select '@' || username from profiles where id = uid
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Create profile from sign-up metadata.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, full_name, bio, location, level, main_language, languages)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    coalesce(new.raw_user_meta_data ->> 'location', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'level', ''), 'junior'),
    coalesce(new.raw_user_meta_data ->> 'main_language', ''),
    case when coalesce(new.raw_user_meta_data ->> 'main_language', '') = '' then '{}'
         else array[new.raw_user_meta_data ->> 'main_language'] end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Counters
create function public.post_likes_counter() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
    perform notify((select author_id from posts where id = new.post_id), new.user_id, 'post_like',
      uname(new.user_id) || ' liked your post', '/posts/' || new.post_id);
  else
    update posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end $$;
create trigger post_likes_count after insert or delete on public.post_likes
  for each row execute function public.post_likes_counter();

create function public.comment_likes_counter() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update comments set likes_count = likes_count + 1 where id = new.comment_id;
  else update comments set likes_count = likes_count - 1 where id = old.comment_id; end if;
  return null;
end $$;
create trigger comment_likes_count after insert or delete on public.comment_likes
  for each row execute function public.comment_likes_counter();

create function public.comments_counter() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  link text;
begin
  if tg_op = 'DELETE' then
    if old.post_id is not null then update posts set comments_count = comments_count - 1 where id = old.post_id; end if;
    return null;
  end if;
  link := case
    when new.post_id is not null then '/posts/' || new.post_id
    when new.question_id is not null then '/questions/' || new.question_id
    else '/questions/' || (select question_id from answers where id = new.answer_id) end;
  if new.post_id is not null then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  end if;
  if new.parent_id is not null then
    perform notify((select author_id from comments where id = new.parent_id), new.author_id, 'comment_reply',
      uname(new.author_id) || ' replied to your comment', link);
  elsif new.post_id is not null then
    perform notify((select author_id from posts where id = new.post_id), new.author_id, 'post_comment',
      uname(new.author_id) || ' commented on your post', link);
  elsif new.question_id is not null then
    perform notify((select author_id from questions where id = new.question_id), new.author_id, 'post_comment',
      uname(new.author_id) || ' commented on your question', link);
  else
    perform notify((select author_id from answers where id = new.answer_id), new.author_id, 'post_comment',
      uname(new.author_id) || ' commented on your answer', link);
  end if;
  return null;
end $$;
create trigger comments_count after insert or delete on public.comments
  for each row execute function public.comments_counter();

create function public.answers_counter() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update questions set answers_count = answers_count + 1 where id = new.question_id;
    perform notify((select author_id from questions where id = new.question_id), new.author_id, 'question_answer',
      uname(new.author_id) || ' answered your question', '/questions/' || new.question_id);
  else
    update questions set answers_count = answers_count - 1 where id = old.question_id;
  end if;
  return null;
end $$;
create trigger answers_count after insert or delete on public.answers
  for each row execute function public.answers_counter();

create function public.answer_votes_score() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update answers set score = score + coalesce(case when tg_op <> 'DELETE' then new.value end, 0)
                                   - coalesce(case when tg_op <> 'INSERT' then old.value end, 0)
  where id = coalesce(new.answer_id, old.answer_id);
  if tg_op <> 'DELETE' and new.value = 1 then
    perform notify((select author_id from answers where id = new.answer_id), new.user_id, 'answer_upvote',
      uname(new.user_id) || ' upvoted your answer',
      '/questions/' || (select question_id from answers where id = new.answer_id));
  end if;
  return null;
end $$;
create trigger answer_votes_score after insert or update or delete on public.answer_votes
  for each row execute function public.answer_votes_score();

create function public.question_votes_score() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update questions set score = score + coalesce(case when tg_op <> 'DELETE' then new.value end, 0)
                                     - coalesce(case when tg_op <> 'INSERT' then old.value end, 0)
  where id = coalesce(new.question_id, old.question_id);
  return null;
end $$;
create trigger question_votes_score after insert or update or delete on public.question_votes
  for each row execute function public.question_votes_score();

create function public.on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify(new.following_id, new.follower_id, 'follow', uname(new.follower_id) || ' started following you',
    '/developers/' || (select username from profiles where id = new.follower_id));
  return null;
end $$;
create trigger on_follow after insert on public.follows
  for each row execute function public.on_follow();

-- Projects: owner becomes a member, and a team chat is created.
create function public.on_project_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  insert into project_members (project_id, user_id, role) values (new.id, new.owner_id, 'Owner');
  insert into conversations (project_id, title) values (new.id, new.name) returning id into cid;
  insert into conversation_members (conversation_id, user_id) values (cid, new.owner_id);
  return null;
end $$;
create trigger on_project_created after insert on public.projects
  for each row execute function public.on_project_created();

create function public.on_project_renamed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update conversations set title = new.name where project_id = new.id;
  return null;
end $$;
create trigger on_project_renamed after update of name on public.projects
  for each row execute function public.on_project_renamed();

-- Keep team chat membership in sync with project_members.
create function public.sync_project_chat() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into conversation_members (conversation_id, user_id)
      select id, new.user_id from conversations where project_id = new.project_id
      on conflict do nothing;
  else
    delete from conversation_members
      where user_id = old.user_id
        and conversation_id = (select id from conversations where project_id = old.project_id);
  end if;
  return null;
end $$;
create trigger sync_project_chat after insert or delete on public.project_members
  for each row execute function public.sync_project_chat();

create function public.on_join_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p projects;
begin
  select * into p from projects where id = new.project_id;
  if tg_op = 'INSERT' then
    perform notify(p.owner_id, new.user_id, 'join_request',
      uname(new.user_id) || ' wants to join ' || p.name, '/projects/' || p.id);
  elsif new.status = 'accepted' and old.status = 'pending' then
    insert into project_members (project_id, user_id, role) values (new.project_id, new.user_id, new.role)
      on conflict do nothing;
    perform notify(new.user_id, p.owner_id, 'join_accepted',
      'Your request to join ' || p.name || ' was accepted', '/projects/' || p.id);
  end if;
  return null;
end $$;
create trigger on_join_request after insert or update of status on public.project_join_requests
  for each row execute function public.on_join_request();

-- Groups: creator becomes admin; activity notifications.
create function public.on_group_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into group_members (group_id, user_id, role) values (new.id, new.created_by, 'admin');
  end if;
  return null;
end $$;
create trigger on_group_created after insert on public.groups
  for each row execute function public.on_group_created();

create function public.on_group_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m record;
begin
  if new.group_id is null then return null; end if;
  for m in select user_id from group_members where group_id = new.group_id loop
    perform notify(m.user_id, new.author_id, 'group_activity',
      uname(new.author_id) || ' posted in ' || (select name from groups where id = new.group_id),
      '/groups/' || new.group_id);
  end loop;
  return null;
end $$;
create trigger on_group_post after insert on public.posts
  for each row execute function public.on_group_post();

create function public.on_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m record;
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  update conversation_members set last_read_at = new.created_at
    where conversation_id = new.conversation_id and user_id = new.sender_id;
  for m in select user_id from conversation_members where conversation_id = new.conversation_id loop
    perform notify(m.user_id, new.sender_id, 'message', uname(new.sender_id) || ' sent you a message',
      '/messages/' || new.conversation_id);
  end loop;
  return null;
end $$;
create trigger on_message after insert on public.messages
  for each row execute function public.on_message();

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger posts_touch before update of content, code, language, image_urls, project_link on public.posts
  for each row execute function public.touch_updated_at();
create trigger questions_touch before update of title, description, code, language on public.questions
  for each row execute function public.touch_updated_at();

-- =========================================================
-- RPC
-- =========================================================

create function public.get_or_create_dm(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  if auth.uid() is null or other = auth.uid() then raise exception 'invalid user'; end if;
  if not is_active() then raise exception 'account suspended'; end if;
  select c.id into cid from conversations c
    join conversation_members a on a.conversation_id = c.id and a.user_id = auth.uid()
    join conversation_members b on b.conversation_id = c.id and b.user_id = other
    where c.project_id is null
      and (select count(*) from conversation_members x where x.conversation_id = c.id) = 2
    limit 1;
  if cid is null then
    insert into conversations default values returning id into cid;
    insert into conversation_members (conversation_id, user_id) values (cid, auth.uid()), (cid, other);
  end if;
  return cid;
end $$;

-- Conversation list with the other participant, last message and unread count.
create function public.my_conversations()
returns table (id uuid, project_id uuid, title text, last_message_at timestamptz,
               other_id uuid, other_username text, other_name text, other_avatar text,
               last_message text, unread bigint)
language sql stable security definer set search_path = public as $$
  select c.id, c.project_id, c.title, c.last_message_at,
         o.id, o.username, o.full_name, o.avatar_url,
         (select content from messages m where m.conversation_id = c.id order by created_at desc limit 1),
         (select count(*) from messages m where m.conversation_id = c.id
            and m.created_at > me.last_read_at and m.sender_id <> auth.uid())
  from conversation_members me
  join conversations c on c.id = me.conversation_id
  left join lateral (
    select p.* from conversation_members x join profiles p on p.id = x.user_id
    where x.conversation_id = c.id and x.user_id <> auth.uid() and c.project_id is null limit 1
  ) o on true
  where me.user_id = auth.uid()
  order by c.last_message_at desc
$$;

create function public.delete_my_account() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid()
$$;

create function public.admin_set_suspended(uid uuid, value boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  update profiles set is_suspended = value where id = uid;
end $$;

create function public.admin_delete_user(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  delete from auth.users where id = uid;
end $$;

-- Username availability check works before login (profiles are not readable by anon).
create function public.username_available(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(name))
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.follows enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.questions enable row level security;
alter table public.question_tags enable row level security;
alter table public.question_votes enable row level security;
alter table public.answers enable row level security;
alter table public.answer_votes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_join_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.jobs enable row level security;
alter table public.saved_posts enable row level security;
alter table public.saved_questions enable row level security;
alter table public.saved_projects enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.reports enable row level security;

-- profiles: readable by signed-in users; only own row editable, and never the admin/suspended flags.
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (username, full_name, avatar_url, bio, location, level, main_language, languages,
              github, website, is_private, notification_prefs) on public.profiles to authenticated;

create policy "skills read" on public.skills for select to authenticated using (true);
create policy "skills add" on public.skills for insert to authenticated with check (is_active());

create policy "user_skills read" on public.user_skills for select to authenticated using (true);
create policy "user_skills own" on public.user_skills for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "follows read" on public.follows for select to authenticated using (true);
create policy "follows insert own" on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and is_active());
create policy "follows delete own" on public.follows for delete to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

create policy "groups read" on public.groups for select to authenticated using (true);
create policy "groups create" on public.groups for insert to authenticated
  with check (created_by = auth.uid() and is_active());
create policy "groups edit" on public.groups for update to authenticated
  using (is_group_admin(id) or is_admin());
create policy "groups delete" on public.groups for delete to authenticated
  using (is_group_admin(id) or is_admin());

create policy "group_members read" on public.group_members for select to authenticated using (true);
create policy "group_members join" on public.group_members for insert to authenticated
  with check (user_id = auth.uid() and role = 'member' and is_active());
create policy "group_members manage" on public.group_members for update to authenticated
  using (is_group_admin(group_id) or is_admin());
create policy "group_members leave or remove" on public.group_members for delete to authenticated
  using (user_id = auth.uid() or is_group_admin(group_id) or is_admin());

create policy "posts read" on public.posts for select to authenticated
  using (group_id is not null or can_view_user(author_id));
create policy "posts insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and is_active() and (group_id is null or is_group_member(group_id)));
create policy "posts update own" on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts delete" on public.posts for delete to authenticated
  using (author_id = auth.uid() or is_admin() or (group_id is not null and is_group_admin(group_id)));
-- counters are maintained by triggers only, so clients may update content columns only
revoke update on public.posts from authenticated, anon;
grant update (content, code, language, image_urls, project_link) on public.posts to authenticated;

create policy "post_likes read" on public.post_likes for select to authenticated using (true);
create policy "post_likes own" on public.post_likes for insert to authenticated
  with check (user_id = auth.uid() and is_active());
create policy "post_likes unlike" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create policy "questions read" on public.questions for select to authenticated using (true);
create policy "questions insert" on public.questions for insert to authenticated
  with check (author_id = auth.uid() and is_active());
create policy "questions update own" on public.questions for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "questions delete" on public.questions for delete to authenticated
  using (author_id = auth.uid() or is_admin());
revoke update on public.questions from authenticated, anon;
grant update (title, description, code, language, status, accepted_answer_id) on public.questions to authenticated;

create policy "question_tags read" on public.question_tags for select to authenticated using (true);
create policy "question_tags own" on public.question_tags for all to authenticated
  using (exists (select 1 from questions q where q.id = question_id and q.author_id = auth.uid()))
  with check (exists (select 1 from questions q where q.id = question_id and q.author_id = auth.uid()));

create policy "question_votes read" on public.question_votes for select to authenticated using (true);
create policy "question_votes own" on public.question_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active());

create policy "answers read" on public.answers for select to authenticated using (true);
create policy "answers insert" on public.answers for insert to authenticated
  with check (author_id = auth.uid() and is_active());
create policy "answers update own" on public.answers for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "answers delete" on public.answers for delete to authenticated
  using (author_id = auth.uid() or is_admin());
revoke update on public.answers from authenticated, anon;
grant update (content, code) on public.answers to authenticated;

create policy "answer_votes read" on public.answer_votes for select to authenticated using (true);
create policy "answer_votes own" on public.answer_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active());

create policy "comments read" on public.comments for select to authenticated
  using (post_id is null or exists (select 1 from posts p where p.id = post_id));
create policy "comments insert" on public.comments for insert to authenticated
  with check (author_id = auth.uid() and is_active());
create policy "comments delete" on public.comments for delete to authenticated
  using (author_id = auth.uid() or is_admin()
         or exists (select 1 from posts p where p.id = post_id and p.group_id is not null and is_group_admin(p.group_id)));

create policy "comment_likes read" on public.comment_likes for select to authenticated using (true);
create policy "comment_likes insert" on public.comment_likes for insert to authenticated
  with check (user_id = auth.uid() and is_active());
create policy "comment_likes delete" on public.comment_likes for delete to authenticated using (user_id = auth.uid());

create policy "projects read" on public.projects for select to authenticated using (true);
create policy "projects insert" on public.projects for insert to authenticated
  with check (owner_id = auth.uid() and is_active());
create policy "projects update own" on public.projects for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "projects delete" on public.projects for delete to authenticated
  using (owner_id = auth.uid() or is_admin());

create policy "project_members read" on public.project_members for select to authenticated using (true);
create policy "project_members owner update" on public.project_members for update to authenticated
  using (is_project_owner(project_id));
create policy "project_members remove or leave" on public.project_members for delete to authenticated
  using ((is_project_owner(project_id) and user_id <> auth.uid()) or (user_id = auth.uid() and not is_project_owner(project_id)));

create policy "join_requests read" on public.project_join_requests for select to authenticated
  using (user_id = auth.uid() or is_project_owner(project_id));
create policy "join_requests insert" on public.project_join_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and is_active()
              and not exists (select 1 from project_members m where m.project_id = project_join_requests.project_id and m.user_id = auth.uid()));
create policy "join_requests owner decides" on public.project_join_requests for update to authenticated
  using (is_project_owner(project_id)) with check (is_project_owner(project_id));
create policy "join_requests cancel own" on public.project_join_requests for delete to authenticated
  using (user_id = auth.uid());

create policy "conversations read" on public.conversations for select to authenticated
  using (is_conversation_member(id));

create policy "conversation_members read" on public.conversation_members for select to authenticated
  using (is_conversation_member(conversation_id));
create policy "conversation_members mark read" on public.conversation_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "messages read" on public.messages for select to authenticated
  using (is_conversation_member(conversation_id));
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and is_conversation_member(conversation_id) and is_active());
create policy "messages delete own" on public.messages for delete to authenticated
  using (sender_id = auth.uid());

create policy "notifications own read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications own update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create policy "jobs read" on public.jobs for select to authenticated using (true);
create policy "jobs insert" on public.jobs for insert to authenticated
  with check (posted_by = auth.uid() and is_active());
create policy "jobs update own" on public.jobs for update to authenticated
  using (posted_by = auth.uid() or is_admin());
create policy "jobs delete" on public.jobs for delete to authenticated
  using (posted_by = auth.uid() or is_admin());

create policy "saved_posts own" on public.saved_posts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved_questions own" on public.saved_questions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved_projects own" on public.saved_projects for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved_jobs own" on public.saved_jobs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reports insert" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "reports admin read" on public.reports for select to authenticated
  using (is_admin() or reporter_id = auth.uid());
create policy "reports admin update" on public.reports for update to authenticated using (is_admin());
create policy "reports admin delete" on public.reports for delete to authenticated using (is_admin());

-- =========================================================
-- STORAGE: one public bucket, each user writes only under "<user id>/..."
-- =========================================================

insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media update own" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- REALTIME
-- =========================================================

alter publication supabase_realtime add table public.messages, public.notifications, public.project_members, public.project_join_requests;
-- DELETE events carry only the primary key under RLS; the chat removes messages by id.

-- =========================================================
-- SEED
-- =========================================================

insert into public.skills (name) values
  ('JavaScript'),('TypeScript'),('React'),('Vue'),('Angular'),('Node.js'),('Python'),('Java'),('C++'),('C#'),
  ('PHP'),('Go'),('Rust'),('SQL'),('MongoDB'),('PostgreSQL'),('Docker'),('Git'),('Kotlin'),('Swift'),
  ('Flutter'),('Django'),('Next.js'),('Tailwind CSS'),('AWS'),('Kubernetes'),('GraphQL'),('Figma')
on conflict do nothing;

insert into public.groups (name, description) values
  ('React Developers', 'Hooks, components, state management and everything React.'),
  ('JavaScript Developers', 'The language of the web — tips, tricks and weird parts.'),
  ('Python Developers', 'From scripts to Django to data science.'),
  ('Beginners', 'No question is too basic. Learn together.'),
  ('Backend Developers', 'APIs, databases, queues and scaling.'),
  ('Uzbekistan Developers', 'O''zbekistonlik dasturchilar hamjamiyati.')
on conflict do nothing;

-- After you sign up, make yourself admin:
-- update public.profiles set is_admin = true where username = 'your_username';
