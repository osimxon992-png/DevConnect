import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, GitBranch, Globe, CalendarDays, Lock, Pencil, Flag } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { LEVELS, PROFILE_FIELDS, label } from '../lib/constants'
import { POST_SELECT, loadPosts } from '../lib/posts'
import { formatDate, safeUrl } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Empty, Loader, Spinner } from '../components/ui'
import { FollowButton, MessageButton, openReport } from '../components/actions'
import PostCard from '../components/PostCard'
import ProjectCard from '../components/ProjectCard'
import UserCard from '../components/UserCard'

export const PROJECT_CARD_SELECT = `*, owner:profiles(${PROFILE_FIELDS}), project_members(role, user_id)`

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const [tab, setTab] = useState('posts')
  const [followDelta, setFollowDelta] = useState(0)

  const { data, loading, error } = useQuery(async () => {
    const p = await q(supabase.from('profiles').select('*').eq('username', username).maybeSingle())
    if (!p) return null
    const [skills, followers, following, iFollow] = await Promise.all([
      q(supabase.from('user_skills').select('skills(name)').eq('user_id', p.id)),
      q(supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id)),
      q(supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id)),
      q(supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', p.id)),
    ])
    return { p, skills: skills.map((s) => s.skills.name), followers, following, iFollow: iFollow.length > 0 }
  }, [username, user.id])

  if (loading) return <Spinner />
  if (error || !data) return <Empty title="Developer not found">{error?.message}</Empty>

  const { p, skills } = data
  const me = p.id === user.id
  const locked = p.is_private && !me && !data.iFollow && followDelta <= 0
  const tabs = [['posts', 'Posts'], ['projects', 'Projects'], ['followers', `Followers · ${data.followers + followDelta}`], ['following', `Following · ${data.following}`]]

  return (
    <>
      <div className="card profile-card">
        <div className="profile-cover" />
        <div className="profile-main stack" style={{ gap: 12 }}>
          <div className="row between wrap" style={{ alignItems: 'flex-end' }}>
            <Avatar profile={p} size={104} ring />
            <div className="row wrap">
              {me ? <Link to="/settings" className="btn"><Pencil size={16} /> Edit profile</Link> : (
                <>
                  <FollowButton userId={p.id} initial={data.iFollow} onChange={(f) => setFollowDelta((d) => d + (f ? 1 : -1))} />
                  <MessageButton userId={p.id} />
                  <button className="btn ghost icon" onClick={() => openReport('user', p.id)} aria-label="Report user" title="Report user"><Flag size={16} /></button>
                </>
              )}
            </div>
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{p.full_name || p.username} {p.is_private && <Lock size={18} className="faint" />}</h1>
            <div className="muted">@{p.username}</div>
          </div>
          {!locked && p.bio && <p className="prewrap" style={{ margin: 0 }}>{p.bio}</p>}
          <div className="row wrap small muted" style={{ gap: 14 }}>
            <span className="chip tag">{label(LEVELS, p.level)}</span>
            {!locked && p.location && <span className="row" style={{ gap: 4 }}><MapPin size={14} /> {p.location}</span>}
            {!locked && p.github && (
              <a className="row" style={{ gap: 4 }} href={p.github.includes('/') ? safeUrl(p.github) : `https://github.com/${p.github}`} target="_blank" rel="noreferrer noopener">
                <GitBranch size={14} /> {p.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
              </a>
            )}
            {!locked && p.website && <a className="row" style={{ gap: 4 }} href={safeUrl(p.website)} target="_blank" rel="noreferrer noopener"><Globe size={14} /> {p.website.replace(/^https?:\/\//, '')}</a>}
            <span className="row" style={{ gap: 4 }}><CalendarDays size={14} /> Joined {formatDate(p.created_at)}</span>
          </div>
          {!locked && (p.languages.length > 0 || skills.length > 0) && (
            <div className="stack" style={{ gap: 8 }}>
              {p.languages.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{p.languages.map((l) => <span key={l} className="chip orange">{l}</span>)}</div>}
              {skills.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>}
            </div>
          )}
        </div>
      </div>

      {locked ? (
        <div className="card"><Empty icon={Lock} title="This profile is private">Follow @{p.username} to see their posts, projects and details.</Empty></div>
      ) : (
        <>
          <div className="tabs" role="tablist">
            {tabs.map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{t}</button>)}
          </div>
          {tab === 'posts' && <UserPosts userId={p.id} />}
          {tab === 'projects' && <UserProjects userId={p.id} />}
          {tab === 'followers' && <FollowList userId={p.id} column="following_id" other="follower_id" key={`f${followDelta}`} />}
          {tab === 'following' && <FollowList userId={p.id} column="follower_id" other="following_id" />}
        </>
      )}
    </>
  )
}

function UserPosts({ userId }) {
  const { user } = useAuth()
  const { data, setData, loading, error } = useQuery(() => loadPosts(
    supabase.from('posts').select(POST_SELECT).eq('author_id', userId).is('group_id', null).order('created_at', { ascending: false }).limit(50), user.id,
  ), [userId, user.id])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No posts yet">
      <div className="stack">{data?.map((p) => <PostCard key={p.id} post={p} onDeleted={(id) => setData((d) => d.filter((x) => x.id !== id))} />)}</div>
    </Loader>
  )
}

function UserProjects({ userId }) {
  const { data, loading, error } = useQuery(async () => {
    const rows = await q(supabase.from('project_members').select(`role, project:projects(${PROJECT_CARD_SELECT})`).eq('user_id', userId))
    return rows.map((r) => r.project).filter(Boolean)
  }, [userId])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No projects yet">
      <div className="grid">{data?.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
    </Loader>
  )
}

// column = side matching this profile, other = side to list
export function FollowList({ userId, column, other }) {
  const { data, loading, error } = useQuery(async () => {
    const rows = await q(supabase.from('follows').select(`user:profiles!follows_${other}_fkey(${PROFILE_FIELDS})`).eq(column, userId).order('created_at', { ascending: false }))
    return rows.map((r) => r.user)
  }, [userId, column, other])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No one here yet">
      <div className="card">{data?.map((u) => <UserCard key={u.id} user={u} />)}</div>
    </Loader>
  )
}
