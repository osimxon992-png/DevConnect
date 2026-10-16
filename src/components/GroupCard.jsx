import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

export default function GroupCard({ group, joined, onToggle }) {
  return (
    <div className="card hover media-card">
      <Link to={`/groups/${group.id}`} className="cover" style={{ height: 110 }}>
        {group.image_url ? <img src={group.image_url} alt="" loading="lazy" /> : <span className="glyph" style={{ fontSize: '1.8rem' }}>{group.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>}
      </Link>
      <div className="body">
        <Link to={`/groups/${group.id}`}><h3 style={{ margin: 0 }}>{group.name}</h3></Link>
        <p>{group.description || 'A DevConnect community.'}</p>
        <div className="foot">
          <span className="row small muted" style={{ gap: 4 }}><Users size={14} /> {group.group_members?.[0]?.count ?? 0} members</span>
          {onToggle && <button className={`btn sm ${joined ? '' : 'primary'}`} onClick={onToggle}>{joined ? 'Leave' : 'Join'}</button>}
        </div>
      </div>
    </div>
  )
}
