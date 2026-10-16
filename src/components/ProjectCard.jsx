import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { PROJECT_STATUSES } from '../lib/constants'
import { Avatar } from './ui'
import { SaveButton } from './actions'

export function StatusChip({ status }) {
  const [, text, color] = PROJECT_STATUSES.find((s) => s[0] === status) || []
  return <span className={`chip ${color}`}>{text}</span>
}

export default function ProjectCard({ project }) {
  const members = project.project_members?.[0]?.count
  return (
    <div className="card hover media-card">
      <Link to={`/projects/${project.id}`} className="cover">
        {project.image_url ? <img src={project.image_url} alt="" loading="lazy" /> : <span className="glyph">{project.name.slice(0, 2).toUpperCase()}</span>}
      </Link>
      <div className="body">
        <div className="row between"><StatusChip status={project.status} /><SaveButton type="project" id={project.id} /></div>
        <Link to={`/projects/${project.id}`}><h3 style={{ margin: 0 }}>{project.name}</h3></Link>
        <p>{project.description || 'No description yet.'}</p>
        {project.technologies?.length > 0 && (
          <div className="row wrap" style={{ gap: 6 }}>{project.technologies.slice(0, 4).map((t) => <span key={t} className="chip">{t}</span>)}</div>
        )}
        <div className="foot">
          {project.owner && <span className="row small muted" style={{ gap: 6 }}><Avatar profile={project.owner} size={22} /> @{project.owner.username}</span>}
          <span className="row small muted" style={{ gap: 4 }}><Users size={14} /> {members ?? '–'}/{project.team_size}</span>
        </div>
      </div>
    </div>
  )
}
