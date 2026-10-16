import { Link } from 'react-router-dom'
import { Crown, UserMinus } from 'lucide-react'
import { ROLES } from '../lib/constants'
import { Avatar, Select } from './ui'

// Team section. Owner gets role selects and remove buttons.
export default function ProjectMemberList({ members, isOwner, onRoleChange, onRemove }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      {members.map((m) => (
        <div key={m.user_id} className="row wrap" style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
          <Link to={`/developers/${m.profile?.username}`}><Avatar profile={m.profile} size={42} /></Link>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Link to={`/developers/${m.profile?.username}`} style={{ fontWeight: 600 }}>
              {m.profile?.full_name || m.profile?.username} {m.role === 'Owner' && <Crown size={14} color="var(--orange)" />}
            </Link>
            <div className="faint small">@{m.profile?.username} · {m.role}</div>
            {m.skills.length > 0 && <div className="row wrap" style={{ gap: 4, marginTop: 4 }}>{m.skills.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}</div>}
          </div>
          {isOwner && m.role !== 'Owner' && (
            <div className="row">
              <Select options={ROLES} value={ROLES.includes(m.role) ? m.role : 'Other'} onChange={(e) => onRoleChange(m, e.target.value)} aria-label="Member role" />
              <button className="btn danger sm" onClick={() => onRemove(m)} aria-label="Remove member"><UserMinus size={15} /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
