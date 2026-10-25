import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Trash2, Ban, CheckCircle2, XCircle } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS, REPORT_REASONS, label } from '../lib/constants'
import { like, timeAgo } from '../lib/utils'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Loader, Select, UserLink } from '../components/ui'

const CONTENT_TABLE = { post: 'posts', comment: 'comments', question: 'questions', project: 'projects', job: 'jobs' }

function useAdminAction(reload) {
  const toast = useToast()
  return async (promise, ok, confirmText) => {
    if (confirmText && !confirm(confirmText)) return false
    const { error } = await promise
    if (error) { toast(error.message, 'error'); return false }
    toast(ok)
    reload()
    return true
  }
}

const SECTIONS = {
  reports: ['Reports', 'Review what members flagged.', () => <Reports />],
  users: ['Users', 'Suspend or remove accounts.', () => <Users />],
  posts: ['Posts', 'Latest posts across the network.', () => <ContentTable table="posts" select={`id, content, created_at, author:profiles!author_id(${PROFILE_FIELDS})`} title={(r) => r.content.slice(0, 120) || '(code/image post)'} link={(r) => `/posts/${r.id}`} />],
  questions: ['Questions', 'Latest questions.', () => <ContentTable table="questions" select={`id, title, created_at, author:profiles!author_id(${PROFILE_FIELDS})`} title={(r) => r.title} link={(r) => `/questions/${r.id}`} />],
  projects: ['Projects', 'Latest projects.', () => <ContentTable table="projects" select={`id, name, created_at, author:profiles!owner_id(${PROFILE_FIELDS})`} title={(r) => r.name} link={(r) => `/projects/${r.id}`} />],
  groups: ['Groups', 'All groups.', () => <ContentTable table="groups" select="id, name, created_at" title={(r) => r.name} link={(r) => `/groups/${r.id}`} />],
  jobs: ['Jobs', 'Latest job posts.', () => <ContentTable table="jobs" select={`id, title, company, created_at, author:profiles!posted_by(${PROFILE_FIELDS})`} title={(r) => `${r.title} — ${r.company}`} link={(r) => `/jobs/${r.id}`} />],
}

export default function Admin() {
  const { section } = useParams()
  if (!section) return <Overview />
  if (!SECTIONS[section]) return <Navigate to="/admin" replace />
  const [title, text, render] = SECTIONS[section]
  return (
    <>
      <div className="page-head"><div><h1>{title}</h1><p>{text}</p></div></div>
      {render()}
    </>
  )
}

const count = (table, filter) => {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) query = query.eq(...filter)
  return q(query)
}

function Overview() {
  const { data, loading, error } = useQuery(async () => {
    const stats = [
      ['users', 'Users', 'profiles'], ['suspended', 'Suspended', 'profiles', ['is_suspended', true]],
      ['reports', 'Open reports', 'reports', ['status', 'open']], ['posts', 'Posts', 'posts'],
      ['questions', 'Questions', 'questions'], ['projects', 'Projects', 'projects'],
      ['groups', 'Groups', 'groups'], ['jobs', 'Jobs', 'jobs'],
    ]
    const values = await Promise.all(stats.map(([, , table, filter]) => count(table, filter)))
    return stats.map(([key, label], i) => [key, label, values[i]])
  }, [])
  return (
    <>
      <div className="page-head"><div><h1>Admin panel</h1><p>Moderate users, content and reports.</p></div></div>
      <Loader loading={loading} error={error}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {data?.map(([key, label, value]) => (
            <Link key={key + label} to={`/admin/${key === 'suspended' ? 'users' : key}`} className="card stat">
              <b>{value}</b><span>{label}</span>
            </Link>
          ))}
        </div>
      </Loader>
    </>
  )
}

function Reports() {
  const [status, setStatus] = useState('open')
  const { data, loading, error, reload } = useQuery(async () => {
    const reports = await q(supabase.from('reports').select(`*, reporter:profiles!reporter_id(${PROFILE_FIELDS})`).eq('status', status).order('created_at', { ascending: false }).limit(100))
    // resolve each target to a label + link
    const ids = (type) => reports.filter((r) => r.target_type === type).map((r) => r.target_id)
    const fetch = (table, cols, type) => (ids(type).length ? q(supabase.from(table).select(cols).in('id', ids(type))) : [])
    const [users, posts, comments, questions, projects, jobs] = await Promise.all([
      fetch('profiles', 'id, username', 'user'), fetch('posts', 'id, content', 'post'),
      fetch('comments', 'id, content, post_id, question_id, answer_id, answer:answers(question_id)', 'comment'),
      fetch('questions', 'id, title', 'question'), fetch('projects', 'id, name', 'project'), fetch('jobs', 'id, title', 'job'),
    ])
    const targets = {}
    users.forEach((x) => { targets[x.id] = [`@${x.username}`, `/developers/${x.username}`] })
    posts.forEach((x) => { targets[x.id] = [x.content.slice(0, 80) || 'Post', `/posts/${x.id}`] })
    comments.forEach((x) => {
      const link = x.post_id ? `/posts/${x.post_id}` : `/questions/${x.question_id || x.answer?.question_id}`
      targets[x.id] = [x.content.slice(0, 80), link]
    })
    questions.forEach((x) => { targets[x.id] = [x.title, `/questions/${x.id}`] })
    projects.forEach((x) => { targets[x.id] = [x.name, `/projects/${x.id}`] })
    jobs.forEach((x) => { targets[x.id] = [x.title, `/jobs/${x.id}`] })
    return reports.map((r) => ({ ...r, target: targets[r.target_id] }))
  }, [status])
  const act = useAdminAction(reload)
  const setReport = (r, s) => act(supabase.from('reports').update({ status: s }).eq('id', r.id), `Report ${s}`)
  const removeTarget = async (r) => {
    const ok = r.target_type === 'user'
      ? await act(supabase.rpc('admin_delete_user', { uid: r.target_id }), 'User deleted', 'Permanently delete this user and all their content?')
      : await act(supabase.from(CONTENT_TABLE[r.target_type]).delete().eq('id', r.target_id), 'Content deleted', `Delete this ${r.target_type}?`)
    if (ok) setReport(r, 'resolved')
  }

  return (
    <>
      <div className="tabs">
        {['open', 'resolved', 'dismissed'].map((s) => <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
      </div>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle={`No ${status} reports`}>
        <div className="stack">
          {data?.map((r) => (
            <div key={r.id} className="card stack" style={{ gap: 8 }}>
              <div className="row between wrap">
                <div className="row wrap" style={{ gap: 6 }}>
                  <span className="chip red">{label(REPORT_REASONS, r.reason)}</span>
                  <span className="chip">{r.target_type}</span>
                  <span className="faint small">by <UserLink profile={r.reporter} /> · {timeAgo(r.created_at)}</span>
                </div>
              </div>
              <div>{r.target ? <Link to={r.target[1]} className="link">{r.target[0]}</Link> : <span className="faint">Target already deleted</span>}</div>
              {r.details && <div className="muted small prewrap">{r.details}</div>}
              {status === 'open' && (
                <div className="row wrap">
                  {r.target && <button className="btn danger sm" onClick={() => removeTarget(r)}><Trash2 size={14} /> Delete {r.target_type}</button>}
                  {r.target_type === 'user' && r.target && (
                    <button className="btn sm" onClick={() => act(supabase.rpc('admin_set_suspended', { uid: r.target_id, value: true }), 'User suspended').then((ok) => ok && setReport(r, 'resolved'))}>
                      <Ban size={14} /> Suspend
                    </button>
                  )}
                  <button className="btn sm" onClick={() => setReport(r, 'resolved')}><CheckCircle2 size={14} /> Resolve</button>
                  <button className="btn ghost sm" onClick={() => setReport(r, 'dismissed')}><XCircle size={14} /> Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Loader>
    </>
  )
}

function Users() {
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const { data, loading, error, reload } = useQuery(() => {
    let query = supabase.from('profiles').select('id, username, full_name, avatar_url, is_admin, is_suspended, created_at').order('created_at', { ascending: false }).limit(100)
    if (search) query = query.or(`username.ilike.${like(search)},full_name.ilike.${like(search)}`)
    if (filter === 'suspended') query = query.eq('is_suspended', true)
    if (filter === 'admins') query = query.eq('is_admin', true)
    return q(query)
  }, [search, filter])
  const act = useAdminAction(reload)
  return (
    <>
      <form className="card row wrap" onSubmit={(e) => { e.preventDefault(); setSearch(text.trim()) }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Search users" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search users" />
        <div style={{ width: 180 }}><Select options={[['', 'All users'], ['suspended', 'Suspended'], ['admins', 'Admins']]} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter users" /></div>
        <button className="btn">Search</button>
      </form>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No users">
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id}>
                  <td><Link to={`/developers/${u.username}`} className="row"><Avatar profile={u} size={30} /> <span>{u.full_name || u.username}<br /><span className="faint small">@{u.username}</span></span></Link></td>
                  <td className="small muted">{timeAgo(u.created_at)}</td>
                  <td>{u.is_admin && <span className="chip tag">admin</span>} {u.is_suspended ? <span className="chip red">suspended</span> : <span className="chip green">active</span>}</td>
                  <td>
                    {!u.is_admin && (
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn sm" onClick={() => act(supabase.rpc('admin_set_suspended', { uid: u.id, value: !u.is_suspended }), u.is_suspended ? 'User reactivated' : 'User suspended')}>
                          <Ban size={14} /> {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button className="btn danger sm" onClick={() => act(supabase.rpc('admin_delete_user', { uid: u.id }), 'User deleted', `Permanently delete @${u.username} and all their content?`)} aria-label="Delete user"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loader>
    </>
  )
}

function ContentTable({ table, select, title, link }) {
  const { data, loading, error, reload } = useQuery(
    () => q(supabase.from(table).select(select).order('created_at', { ascending: false }).limit(100)), [table, select])
  const act = useAdminAction(reload)
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle={`No ${table}`}>
      <div className="card table-wrap">
        <table className="table">
          <tbody>
            {data?.map((r) => (
              <tr key={r.id}>
                <td style={{ maxWidth: 420 }}><Link to={link(r)} className="ellipsis" style={{ display: 'block' }}>{title(r)}</Link></td>
                <td className="small muted">{r.author ? <UserLink profile={r.author} /> : null}</td>
                <td className="small muted">{timeAgo(r.created_at)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn danger sm" onClick={() => act(supabase.from(table).delete().eq('id', r.id), 'Deleted', 'Delete permanently?')} aria-label="Delete"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Loader>
  )
}
