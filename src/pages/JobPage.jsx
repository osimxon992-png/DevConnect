import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, MapPin, Wallet, Building2, Pencil, Trash2 } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { EMPLOYMENT_TYPES, PROFILE_FIELDS, WORK_MODES, label } from '../lib/constants'
import { formatDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Empty, Menu, Spinner, UserLink } from '../components/ui'
import { ReportItem, SaveButton } from '../components/actions'
import { JobForm } from './Jobs'

export default function JobPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { data: job, loading, error, reload } = useQuery(
    () => q(supabase.from('jobs').select(`*, poster:profiles(${PROFILE_FIELDS})`).eq('id', id).maybeSingle()), [id])

  if (loading && !job) return <Spinner />
  if (error || !job) return <Empty title="Job not found">{error?.message}</Empty>
  const mine = job.posted_by === user.id

  const remove = async () => {
    if (!confirm('Delete this job listing?')) return
    const { error } = await supabase.from('jobs').delete().eq('id', job.id)
    if (error) return toast(error.message, 'error')
    navigate('/jobs')
  }

  return (
    <div className="card stack">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0 }}>{job.title}</h1>
          <div className="row muted" style={{ gap: 6, marginTop: 6 }}><Building2 size={16} /> {job.company}</div>
        </div>
        <div className="row" style={{ gap: 2 }}>
          <SaveButton type="job" id={job.id} withLabel />
          <Menu>
            {mine && <button onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>}
            {(mine || profile.is_admin) && <button className="danger" onClick={remove}><Trash2 size={15} /> Delete</button>}
            {!mine && <ReportItem type="job" id={job.id} />}
          </Menu>
        </div>
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="chip tag">{label(WORK_MODES, job.work_mode)}</span>
        <span className="chip blue">{label(EMPLOYMENT_TYPES, job.employment_type)}</span>
        {job.location && <span className="chip"><MapPin size={12} /> {job.location}</span>}
        {job.salary && <span className="chip green"><Wallet size={12} /> {job.salary}</span>}
      </div>
      <div><h3>Description</h3><div className="prewrap">{job.description}</div></div>
      {job.requirements && <div><h3>Requirements</h3><div className="prewrap">{job.requirements}</div></div>}
      {job.technologies.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{job.technologies.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
      <div className="row between wrap">
        <span className="row small muted" style={{ gap: 6 }}>
          <Avatar profile={job.poster} size={22} /> Posted by <UserLink profile={job.poster} /> on {formatDate(job.created_at)}
        </span>
        <a className="btn primary" href={job.apply_url} target="_blank" rel="noreferrer noopener"><ExternalLink size={16} /> Apply</a>
      </div>
      {editing && <JobForm job={job} onClose={() => setEditing(false)} onSaved={reload} />}
    </div>
  )
}
