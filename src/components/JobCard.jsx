import { Link } from 'react-router-dom'
import { MapPin, Wallet } from 'lucide-react'
import { EMPLOYMENT_TYPES, WORK_MODES, label } from '../lib/constants'
import { timeAgo } from '../lib/utils'
import { SaveButton } from './actions'

export default function JobCard({ job }) {
  return (
    <article className="flyer green">
      <div className="flyer-body">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <Link to={`/jobs/${job.id}`}><h3 className="flyer-title" style={{ fontSize: '1.6rem' }}>{job.title}</h3></Link>
          <SaveButton type="job" id={job.id} />
        </div>
        <div className="small" style={{ fontWeight: 700 }}>{job.company} · {timeAgo(job.created_at)}</div>
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="chip">{label(WORK_MODES, job.work_mode)}</span>
          <span className="chip">{label(EMPLOYMENT_TYPES, job.employment_type)}</span>
          {job.location && <span className="chip"><MapPin size={12} /> {job.location}</span>}
          {job.salary && <span className="chip"><Wallet size={12} /> {job.salary}</span>}
        </div>
        {job.technologies.length > 0 && <p className="small" style={{ fontWeight: 700, marginTop: 'auto' }}>{job.technologies.slice(0, 6).join(' · ')}</p>}
      </div>
    </article>
  )
}
