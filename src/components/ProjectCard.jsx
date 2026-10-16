import { Link, useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { PROJECT_STATUSES } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui'
import { SaveButton } from './actions'

export function StatusChip({ status }) {
  const [, text, color] = PROJECT_STATUSES.find((s) => s[0] === status) || []
  return <span className={`chip ${color}`}>{text}</span>
}

// Roles a project still needs: a required role is "taken" once a team member holds it.
export function roleTabs(project, members) {
  const held = new Set(members.filter((m) => m.role !== 'Owner').map((m) => m.role))
  return project.required_roles.map((role) => ({ role, taken: held.has(role) }))
}

// Signature move: a perforated row of vertical role tabs at the foot of a project flyer.
export function TearTabs({ tabs, onTear }) {
  if (!tabs.length) return null
  return (
    <div className="tear-tabs" role="group" aria-label="Roles this project needs">
      {tabs.map(({ role, taken }) => (taken || !onTear
        ? <span key={role} className={`tear-tab ${taken ? 'taken' : ''}`} aria-label={taken ? `${role}: filled` : role}>{role}</span>
        : <button key={role} type="button" className="tear-tab" onClick={() => onTear(role)} title={`Ask to join as ${role}`}>{role}</button>
      ))}
    </div>
  )
}

export default function ProjectCard({ project }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const members = project.project_members || []
  const isMember = members.some((m) => m.user_id === user.id)
  const canJoin = !isMember && project.status !== 'completed'
  return (
    <article className="flyer pink">
      {project.image_url && <Link to={`/projects/${project.id}`}><img className="flyer-photo" src={project.image_url} alt="" loading="lazy" /></Link>}
      <div className="flyer-body">
        <div className="row between"><StatusChip status={project.status} /><SaveButton type="project" id={project.id} /></div>
        <Link to={`/projects/${project.id}`}><h3 className="flyer-title">{project.name}</h3></Link>
        <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description || 'No description yet.'}</p>
        {project.technologies?.length > 0 && <p className="small" style={{ fontWeight: 700 }}>{project.technologies.slice(0, 5).join(' · ')}</p>}
        <div className="flyer-foot">
          {project.owner && <span className="row" style={{ gap: 6 }}><Avatar profile={project.owner} size={22} /> @{project.owner.username}</span>}
          <span className="row" style={{ gap: 4 }}><Users size={14} /> {members.length}/{project.team_size}</span>
        </div>
      </div>
      <TearTabs tabs={roleTabs(project, members)}
        onTear={canJoin ? (role) => navigate(`/projects/${project.id}?join=${encodeURIComponent(role)}`) : null} />
    </article>
  )
}
