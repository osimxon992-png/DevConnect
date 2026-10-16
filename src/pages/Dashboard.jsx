import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass, Users, UsersRound, Briefcase, Bookmark, Settings, Bell, Shield, LogOut, Plus,
} from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { POST_SELECT, withMyLikes } from '../lib/posts'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Loader, Spinner } from '../components/ui'
import PostCard from '../components/PostCard'
import ProjectCard from '../components/ProjectCard'
import QuestionCard from '../components/QuestionCard'
import NotificationList from '../components/NotificationList'
import { PROJECT_CARD_SELECT, FollowList } from './Profile'
import { QUESTION_SELECT } from './Questions'
import { NOTIF_SELECT } from './Notifications'

const count = (table, col, id) => q(supabase.from(table).select('*', { count: 'exact', head: true }).eq(col, id))

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [tab, setTab] = useState('posts')

  const { data: stats } = useQuery(async () => {
    const [posts, questions, followers, following, saved1, saved2, saved3, saved4, unread] = await Promise.all([
      count('posts', 'author_id', user.id), count('questions', 'author_id', user.id),
      count('follows', 'following_id', user.id), count('follows', 'follower_id', user.id),
      count('saved_posts', 'user_id', user.id), count('saved_questions', 'user_id', user.id),
      count('saved_projects', 'user_id', user.id), count('saved_jobs', 'user_id', user.id),
      q(supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)),
    ])
    return { posts, questions, followers, following, saved: saved1 + saved2 + saved3 + saved4, unread }
  }, [user.id])

  const tabs = [
    ['posts', 'My posts'], ['projects', 'My projects'], ['joined', 'Projects I joined'], ['questions', 'Questions'],
    ['followers', 'Followers'], ['following', 'Following'], ['notifications', 'Notifications'],
  ]
  const links = [
    ['/explore', 'Explore', Compass], ['/developers', 'Developers', Users], ['/groups', 'Groups', UsersRound],
    ['/jobs', 'Jobs', Briefcase], ['/saved', 'Saved', Bookmark], ['/notifications', 'Notifications', Bell],
    ['/settings', 'Settings', Settings], ...(profile.is_admin ? [['/admin', 'Admin', Shield]] : []),
  ]

  return (
    <>
      <div className="hero-banner">
        <div className="row between wrap">
          <div>
            <h1 style={{ margin: 0 }}>Hi, {profile.full_name || profile.username} 👋</h1>
            <p className="muted" style={{ margin: '4px 0 0' }}>Here's what's happening with your work.</p>
          </div>
          <div className="row wrap">
            <Link to="/create-project" className="btn primary sm"><Plus size={15} /> New project</Link>
            <Link to={`/developers/${profile.username}`} className="btn sm">View profile</Link>
          </div>
        </div>
        {stats ? (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', marginTop: 20 }}>
            {[['Posts', stats.posts], ['Questions', stats.questions], ['Followers', stats.followers], ['Following', stats.following], ['Saved', stats.saved], ['Unread', stats.unread]].map(([l, v]) => (
              <div key={l} className="card flat stat" style={{ padding: 12 }}><b>{v}</b><span>{l}</span></div>
            ))}
          </div>
        ) : <Spinner />}
      </div>

      {/* quick links — the sidebar is hidden on phones */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        {links.map(([to, text, Icon]) => <Link key={to} to={to} className="card hover row small" style={{ padding: 12 }}><Icon size={18} /> {text}</Link>)}
        <button className="card hover row small" style={{ padding: 12, cursor: 'pointer', color: 'inherit', font: 'inherit' }} onClick={signOut}><LogOut size={18} /> Log out</button>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{t}</button>)}
      </div>
      {tab === 'posts' && <MyPosts />}
      {tab === 'projects' && <MyProjects owned />}
      {tab === 'joined' && <MyProjects />}
      {tab === 'questions' && <MyQuestions />}
      {tab === 'followers' && <FollowList userId={user.id} column="following_id" other="follower_id" />}
      {tab === 'following' && <FollowList userId={user.id} column="follower_id" other="following_id" />}
      {tab === 'notifications' && <RecentNotifications />}
    </>
  )
}

function MyPosts() {
  const { user } = useAuth()
  const { data, setData, loading, error } = useQuery(async () => withMyLikes(
    await q(supabase.from('posts').select(POST_SELECT).eq('author_id', user.id).order('created_at', { ascending: false }).limit(30)), user.id), [user.id])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="You haven't posted yet">
      <div className="stack">{data?.map((p) => <PostCard key={p.id} post={p} onDeleted={(id) => setData((d) => d.filter((x) => x.id !== id))} />)}</div>
    </Loader>
  )
}

function MyProjects({ owned }) {
  const { user } = useAuth()
  const { data, loading, error } = useQuery(async () => {
    if (owned) return q(supabase.from('projects').select(PROJECT_CARD_SELECT).eq('owner_id', user.id).order('created_at', { ascending: false }))
    const rows = await q(supabase.from('project_members').select(`project:projects(${PROJECT_CARD_SELECT})`).eq('user_id', user.id).neq('role', 'Owner'))
    return rows.map((r) => r.project).filter(Boolean)
  }, [owned, user.id])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle={owned ? 'No projects yet' : "You haven't joined any projects"}>
      <div className="grid">{data?.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
    </Loader>
  )
}

function MyQuestions() {
  const { user } = useAuth()
  const { data, loading, error } = useQuery(
    () => q(supabase.from('questions').select(QUESTION_SELECT).eq('author_id', user.id).order('created_at', { ascending: false })), [user.id])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No questions yet">
      <div className="stack">{data?.map((x) => <QuestionCard key={x.id} question={x} />)}</div>
    </Loader>
  )
}

function RecentNotifications() {
  const { user } = useAuth()
  const { data, loading, error } = useQuery(
    () => q(supabase.from('notifications').select(NOTIF_SELECT).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)), [user.id])
  return (
    <div className="card">
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No notifications">
        {data && <NotificationList items={data} onOpen={() => {}} />}
        <Link to="/notifications" className="btn ghost sm" style={{ marginTop: 8 }}>All notifications</Link>
      </Loader>
    </div>
  )
}
