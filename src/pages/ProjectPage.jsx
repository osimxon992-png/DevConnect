import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GitBranch, Globe, Pencil, Trash2, MessageSquare, LogOut, Check, X, UserPlus } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS, ROLES } from '../lib/constants'
import { formatDate, safeUrl, timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Empty, Field, Menu, Modal, Select, Spinner, TagInput, UserLink } from '../components/ui'
import { ReportItem, SaveButton } from '../components/actions'
import { StatusChip } from '../components/ProjectCard'
import ProjectMemberList from '../components/ProjectMemberList'

export default function ProjectPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)

  const { data, loading, error, reload } = useQuery(async () => {
    const project = await q(supabase.from('projects').select(`*, owner:profiles(${PROFILE_FIELDS})`).eq('id', id).maybeSingle())
    if (!project) return null
    const [members, requests, chat] = await Promise.all([
      q(supabase.from('project_members').select(`*, profile:profiles(${PROFILE_FIELDS})`).eq('project_id', id).order('joined_at')),
      // RLS returns all requests to the owner and only your own to everyone else
      q(supabase.from('project_join_requests').select(`*, profile:profiles(${PROFILE_FIELDS})`).eq('project_id', id).order('created_at', { ascending: false })),
      q(supabase.from('conversations').select('id').eq('project_id', id).maybeSingle()),
    ])
    const skillRows = await q(supabase.from('user_skills').select('user_id, skills(name)').in('user_id', members.map((m) => m.user_id)))
    const skillsBy = {}
    skillRows.forEach((r) => { (skillsBy[r.user_id] ||= []).push(r.skills.name) })
    return { project, members: members.map((m) => ({ ...m, skills: skillsBy[m.user_id] || [] })), requests, chatId: chat?.id }
  }, [id])

  // Live team activity: new members, role changes, join requests.
  useEffect(() => {
    const channel = supabase.channel(`project-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${id}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_join_requests', filter: `project_id=eq.${id}` }, reload)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, reload])

  if (loading && !data) return <Spinner />
  if (error || !data) return <Empty title="Project not found">{error?.message}</Empty>

  const { project: p, members, requests } = data
  const isOwner = p.owner_id === user.id
  const isMember = members.some((m) => m.user_id === user.id)
  const pending = requests.filter((r) => r.status === 'pending')
  const myRequest = requests.find((r) => r.user_id === user.id && r.status === 'pending')
  const lastRejected = !myRequest && requests.find((r) => r.user_id === user.id && r.status === 'rejected')

  const act = async (fn, ok) => {
    const { error } = await fn()
    if (error) return toast(error.message, 'error')
    if (ok) toast(ok)
    reload()
  }
  const remove = async () => {
    if (!confirm('Delete this project? This removes the team and team chat.')) return
    const { error } = await supabase.from('projects').delete().eq('id', p.id)
    if (error) return toast(error.message, 'error')
    navigate('/projects')
  }

  return (
    <>
      <div className="card media-card">
        <div className="cover" style={{ height: 200 }}>
          {p.image_url ? <img src={p.image_url} alt="" /> : <span className="glyph">{p.name.slice(0, 2).toUpperCase()}</span>}
        </div>
        <div className="body" style={{ padding: 22 }}>
          <div className="row between wrap">
            <div className="row wrap"><StatusChip status={p.status} /><span className="chip">{members.length}/{p.team_size} members</span></div>
            <div className="row" style={{ gap: 2 }}>
              <SaveButton type="project" id={p.id} withLabel />
              <Menu>
                {isOwner && <Link to={`/create-project?edit=${p.id}`}><Pencil size={15} /> Edit</Link>}
                {(isOwner || profile.is_admin) && <button className="danger" onClick={remove}><Trash2 size={15} /> Delete</button>}
                {isMember && !isOwner && (
                  <button className="danger" onClick={() => confirm('Leave this project?') && act(() => supabase.from('project_members').delete().eq('project_id', p.id).eq('user_id', user.id), 'You left the project')}>
                    <LogOut size={15} /> Leave project
                  </button>
                )}
                {!isOwner && <ReportItem type="project" id={p.id} />}
              </Menu>
            </div>
          </div>
          <h1 style={{ margin: '4px 0 0' }}>{p.name}</h1>
          <div className="row small muted" style={{ gap: 6 }}>
            <Avatar profile={p.owner} size={22} /> by <UserLink profile={p.owner} /> · created {formatDate(p.created_at)}
          </div>
          <p className="prewrap" style={{ color: 'var(--text)', WebkitLineClamp: 'unset', display: 'block' }}>{p.description || 'No description yet.'}</p>
          {p.technologies.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{p.technologies.map((t) => <span key={t} className="chip violet">{t}</span>)}</div>}
          <div className="row wrap">
            {p.github_url && <a className="btn sm" href={safeUrl(p.github_url)} target="_blank" rel="noreferrer noopener"><GitBranch size={15} /> Repository</a>}
            {p.demo_url && <a className="btn sm" href={safeUrl(p.demo_url)} target="_blank" rel="noreferrer noopener"><Globe size={15} /> Live demo</a>}
            {isMember && data.chatId && <Link className="btn sm primary" to={`/messages/${data.chatId}`}><MessageSquare size={15} /> Team chat</Link>}
            {!isMember && !myRequest && p.status !== 'completed' && (
              <button className="btn sm warm" onClick={() => setJoining(true)}><UserPlus size={15} /> Join Project</button>
            )}
            {myRequest && (
              <span className="row small muted">Request pending ·
                <button className="btn ghost sm" onClick={() => act(() => supabase.from('project_join_requests').delete().eq('id', myRequest.id), 'Request cancelled')}>Cancel</button>
              </span>
            )}
            {lastRejected && !isMember && <span className="chip red">Your last request was declined</span>}
          </div>
        </div>
      </div>

      {p.required_roles.length > 0 && (
        <div className="card">
          <h3>Looking for</h3>
          <div className="row wrap">{p.required_roles.map((r) => <span key={r} className="chip orange">{r}</span>)}</div>
        </div>
      )}

      {isOwner && (
        <div className="card">
          <div className="section-head"><h3>Join requests {pending.length > 0 && <span className="count">{pending.length}</span>}</h3></div>
          {pending.length === 0 ? <p className="muted small" style={{ margin: 0 }}>No pending requests.</p> : pending.map((r) => (
            <div key={r.id} className="stack" style={{ padding: '12px 0', borderBottom: '1px solid var(--line-soft)', gap: 6 }}>
              <div className="row between wrap">
                <Link to={`/developers/${r.profile?.username}`} className="row"><Avatar profile={r.profile} size={34} /><b>{r.profile?.full_name || r.profile?.username}</b></Link>
                <span className="faint small">{timeAgo(r.created_at)}</span>
              </div>
              <div className="small"><span className="chip violet">{r.role}</span></div>
              {r.message && <div className="small"><b>Message:</b> {r.message}</div>}
              {r.reason && <div className="small"><b>Why:</b> {r.reason}</div>}
              {r.skills.length > 0 && <div className="row wrap" style={{ gap: 4 }}>{r.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>}
              <div className="row">
                <button className="btn sm primary" onClick={() => act(() => supabase.from('project_join_requests').update({ status: 'accepted' }).eq('id', r.id), 'Member added')}><Check size={15} /> Accept</button>
                <button className="btn sm danger" onClick={() => act(() => supabase.from('project_join_requests').update({ status: 'rejected' }).eq('id', r.id), 'Request rejected')}><X size={15} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Team</h3>
        <ProjectMemberList members={members} isOwner={isOwner}
          onRoleChange={(m, role) => act(() => supabase.from('project_members').update({ role }).eq('project_id', p.id).eq('user_id', m.user_id), 'Role updated')}
          onRemove={(m) => confirm(`Remove @${m.profile?.username} from the team?`) && act(() => supabase.from('project_members').delete().eq('project_id', p.id).eq('user_id', m.user_id), 'Member removed')} />
      </div>

      {joining && <JoinRequestModal project={p} onClose={() => setJoining(false)} onSent={reload} />}
    </>
  )
}

function JoinRequestModal({ project, onClose, onSent }) {
  const { user } = useAuth()
  const toast = useToast()
  const roles = project.required_roles.length ? project.required_roles : ROLES
  const [form, setForm] = useState({ role: roles[0], message: '', reason: '' })
  const [skills, setSkills] = useState([])
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    supabase.from('user_skills').select('skills(name)').eq('user_id', user.id)
      .then(({ data }) => setSkills((data || []).map((r) => r.skills.name)))
  }, [user.id])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('project_join_requests').insert({ ...form, skills, project_id: project.id, user_id: user.id })
    setBusy(false)
    if (error) return toast(error.code === '23505' ? 'You already have a pending request' : error.message, 'error')
    toast('Request sent to the project owner')
    onSent()
    onClose()
  }
  return (
    <Modal title={`Join ${project.name}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Role"><Select options={roles} value={form.role} onChange={set('role')} /></Field>
        <Field label="Message"><textarea className="textarea" value={form.message} onChange={set('message')} placeholder="Introduce yourself" maxLength={1000} /></Field>
        <Field label="Your skills"><TagInput value={skills} onChange={setSkills} /></Field>
        <Field label="Why do you want to join?"><textarea className="textarea" value={form.reason} onChange={set('reason')} maxLength={1000} /></Field>
        <button className="btn primary" disabled={busy}>Send request</button>
      </form>
    </Modal>
  )
}
