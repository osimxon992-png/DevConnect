import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { label, LEVELS } from '../lib/constants'
import { Avatar } from './ui'
import { FollowButton, MessageButton } from './actions'

export default function DeveloperCard({ dev, following }) {
  const skills = dev.user_skills?.map((s) => s.skills?.name).filter(Boolean) || []
  return (
    <div className="card hover stack" style={{ gap: 10 }}>
      <Link to={`/developers/${dev.username}`} className="row">
        <Avatar profile={dev} size={52} />
        <div style={{ minWidth: 0 }}>
          <div className="ellipsis" style={{ fontWeight: 600 }}>{dev.full_name || dev.username}</div>
          <div className="faint small ellipsis">@{dev.username}</div>
        </div>
      </Link>
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="chip violet">{label(LEVELS, dev.level)}</span>
        {dev.main_language && <span className="chip orange">{dev.main_language}</span>}
        {dev.location && <span className="chip"><MapPin size={12} /> {dev.location}</span>}
      </div>
      {dev.bio && <p className="muted small" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{dev.bio}</p>}
      {skills.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{skills.slice(0, 5).map((s) => <span key={s} className="chip">{s}</span>)}</div>}
      <div className="row" style={{ marginTop: 'auto' }}>
        <FollowButton userId={dev.id} initial={following} size="sm" />
        <MessageButton userId={dev.id} size="sm" />
        <Link to={`/developers/${dev.username}`} className="btn ghost sm">Profile</Link>
      </div>
    </div>
  )
}
