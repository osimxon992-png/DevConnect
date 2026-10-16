import { Link } from 'react-router-dom'
import { Avatar } from './ui'
import { FollowButton } from './actions'

// Compact row used in follower lists, members and search results.
export default function UserCard({ user, subtitle, action, follow = true }) {
  if (!user) return null
  return (
    <div className="row" style={{ padding: '8px 0' }}>
      <Link to={`/developers/${user.username}`}><Avatar profile={user} size={40} /></Link>
      <Link to={`/developers/${user.username}`} style={{ flex: 1, minWidth: 0 }}>
        <div className="ellipsis" style={{ fontWeight: 600 }}>{user.full_name || user.username}</div>
        <div className="faint small ellipsis">{subtitle ?? `@${user.username}`}</div>
      </Link>
      {action}
      {follow && <FollowButton userId={user.id} size="sm" />}
    </div>
  )
}
