import { Link } from 'react-router-dom'
import { MapPin, Wallet } from 'lucide-react'
import { EMPLOYMENT_TYPES, WORK_MODES, label } from '../lib/constants'
import { timeAgo } from '../lib/utils'
import { SaveButton } from './actions'

export default function JobCard({ job }) {
  return (
    <article className="card hover job-card">
      <div className="job-band">
        <span>{label(WORK_MODES, job.work_mode)} · {label(EMPLOYMENT_TYPES, job.employment_type)}</span>
        <SaveButton type="job" id={job.id} />
      </div>
      <div className="q-main">
        <Link to={`/jobs/${job.id}`}><h3>{job.title}</h3></Link>
        <div className="small" style={{ fontWeight: 600 }}>{job.company} <span className="muted">· {timeAgo(job.created_at)}</span></div>
        <div className="row wrap" style={{ gap: 6 }}>
          {job.location && <span className="chip"><MapPin size={12} /> {job.location}</span>}
          {job.salary && <span className="chip"><Wallet size={12} /> {job.salary}</span>}
        </div>
        {job.technologies.length > 0 && <div className="row wrap" style={{ gap: 6, marginTop: 'auto' }}>{job.technologies.slice(0, 6).map((t) => <span key={t} className="chip tag">{t}</span>)}</div>}
      </div>
    </article>
  )
}
