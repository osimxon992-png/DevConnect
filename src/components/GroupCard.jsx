import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

export default function GroupCard({ group, joined, onToggle }) {
  return (
    <article className="flyer orange">
      {group.image_url && <Link to={`/groups/${group.id}`}><img className="flyer-photo" src={group.image_url} alt="" loading="lazy" /></Link>}
      <div className="flyer-body">
        <Link to={`/groups/${group.id}`}><h3 className="flyer-title" style={{ fontSize: '1.7rem' }}>{group.name}</h3></Link>
        <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{group.description || 'A DevConnect group.'}</p>
        <div className="flyer-foot">
          <span className="row" style={{ gap: 4 }}><Users size={14} /> {group.group_members?.[0]?.count ?? 0} members</span>
          {onToggle && <button className={`btn sm ${joined ? '' : 'primary'}`} onClick={onToggle}>{joined ? 'Leave' : 'Join'}</button>}
        </div>
      </div>
    </article>
  )
}
