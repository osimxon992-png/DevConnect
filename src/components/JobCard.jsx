import { Link } from 'react-router-dom'
import { MapPin, Wallet, Building2 } from 'lucide-react'
import { EMPLOYMENT_TYPES, WORK_MODES, label } from '../lib/constants'
import { timeAgo } from '../lib/utils'
import { SaveButton } from './actions'

export default function JobCard({ job }) {
  return (
    <div className="card hover stack" style={{ gap: 10 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <Link to={`/jobs/${job.id}`}><h3 style={{ margin: 0 }}>{job.title}</h3></Link>
          <div className="row small muted" style={{ gap: 6, marginTop: 4 }}><Building2 size={14} /> {job.company} · {timeAgo(job.created_at)}</div>
        </div>
        <SaveButton type="job" id={job.id} />
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="chip violet">{label(WORK_MODES, job.work_mode)}</span>
        <span className="chip blue">{label(EMPLOYMENT_TYPES, job.employment_type)}</span>
        {job.location && <span className="chip"><MapPin size={12} /> {job.location}</span>}
        {job.salary && <span className="chip green"><Wallet size={12} /> {job.salary}</span>}
      </div>
      {job.technologies.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{job.technologies.slice(0, 6).map((t) => <span key={t} className="chip">{t}</span>)}</div>}
    </div>
  )
}
