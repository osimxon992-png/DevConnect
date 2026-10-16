# DevConnect

A social and collaboration platform for developers: profiles, posts with code, Q&A, projects with join requests and team chat, groups, real-time messaging, notifications, jobs, saved items, reports and an admin panel.

React (Vite, JSX) + Supabase (Auth, Postgres with RLS, Storage, Realtime). No AI features.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). It creates all tables, RLS policies, triggers, the `media` storage bucket, realtime publication and seed data (skills, groups).
3. In **Authentication → URL Configuration**, set Site URL to `http://localhost:5173` and add `http://localhost:5173/**` to Redirect URLs (needed for email confirmation and password reset).
   Optional for local testing: turn off **Confirm email** under Authentication → Providers → Email, so sign-up logs you in right away.
4. Copy `.env.example` to `.env` and fill in the URL and anon key from **Project Settings → API**.
5. Run:

```bash
npm install
```

```bash
npm run dev
```



## Structure

```
supabase/schema.sql      database, RLS, triggers, RPCs, storage, realtime, seed
src/lib/                 supabase client + upload helper, constants, utils, post queries
src/context/             AuthContext (session + profile), ToastContext
src/hooks/               useQuery (load/reload/optimistic), useUnread (live nav badges)
src/components/          Layout, Rail, SearchBar, PostCard, PostComposer, CommentSection,
                         QuestionCard/VoteButtons, AnswerCard, ProjectCard, ProjectMemberList,
                         GroupCard, JobCard, DeveloperCard, UserCard, ChatWindow/MessageList,
                         NotificationList, actions (Follow/Message/Save/Report), ui (Modal, Field…)
src/pages/               one file per route
```

## How things work

- **Counters** (likes, comments, answers, votes) are maintained by database triggers; clients cannot write them (column-level grants).
- **Notifications** are created by triggers (follow, like, comment, reply, answer, upvote, join request/accept, message, group post) and respect each user's settings in `profiles.notification_prefs`.
- **Projects** automatically add the owner as a member and create a team chat; accepting a join request (owner updates the request) adds the member and syncs chat membership.
- **Comments** use one table for posts, questions and answers, with `parent_id` for replies. `comment_replies` and `group_posts` are views over `comments` and `posts`.
- **Private profiles**: feed posts, bio and links are visible only to followers. Name, username and avatar stay visible so search and chat still work.
- **Admin** actions that touch `auth.users` or moderation flags run through `security definer` functions that check `is_admin()`.

## Known limits

- Feeds and lists load a fixed page (30–100 items) without infinite scroll.
- Following a private profile is instant (no approval step).
- Code snippets render as plain monospace without syntax colors.
- With email confirmation on, the photo picked at sign-up is not uploaded (no session yet); add it in Settings after first login.
