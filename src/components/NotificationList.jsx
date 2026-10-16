import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { timeAgo } from '../lib/utils'
import { Avatar } from './ui'

export default function NotificationList({ items, onOpen, onDelete }) {
  const navigate = useNavigate()
  return (
    <div className="stack" style={{ gap: 4 }}>
      {items.map((n) => (
        <div key={n.id} className={`notif ${n.is_read ? '' : 'unread'}`}>
          <button className="row" style={{ flex: 1, minWidth: 0, background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', padding: 0 }}
            onClick={() => { onOpen(n); navigate(n.link) }}>
            <Avatar profile={n.actor} size={40} />
            <div style={{ minWidth: 0 }}>
              <div>{n.message}</div>
              <div className="faint small">{timeAgo(n.created_at)}</div>
            </div>
          </button>
          {!n.is_read && <span className="dot" aria-label="Unread" />}
          {onDelete && <button className="icon-btn" onClick={() => onDelete(n)} aria-label="Delete notification"><Trash2 size={15} /></button>}
        </div>
      ))}
    </div>
  )
}
