import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import {
  Home, Compass, Users, HelpCircle, FolderGit2, UsersRound, Briefcase, MessageSquare,
  Bell, Bookmark, LayoutDashboard, Settings, Shield, LogOut,
} from 'lucide-react'
import InstallButton from './InstallButton'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../hooks/useUnread'
import { Avatar } from './ui'
import { ReportHost } from './actions'
import SearchBar from './SearchBar'
import Rail from './Rail'

const MAIN = [
  ['/home', 'Home', Home], ['/explore', 'Explore', Compass], ['/developers', 'Developers', Users],
  ['/questions', 'Questions', HelpCircle], ['/projects', 'Projects', FolderGit2],
  ['/groups', 'Groups', UsersRound], ['/jobs', 'Jobs', Briefcase],
]
const NO_RAIL = ['/messages', '/admin', '/settings', '/dashboard']

function Badge({ count }) {
  return count > 0 ? <span className="count">{count > 99 ? '99+' : count}</span> : null
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const unread = useUnread(profile.id)
  const { pathname } = useLocation()
  const showRail = !NO_RAIL.some((p) => pathname.startsWith(p))

  const personal = [
    ['/messages', 'Messages', MessageSquare, unread.messages],
    ['/notifications', 'Notifications', Bell, unread.notifications],
    ['/saved', 'Saved', Bookmark], ['/dashboard', 'Dashboard', LayoutDashboard], ['/settings', 'Settings', Settings],
    ...(profile.is_admin ? [['/admin', 'Admin', Shield]] : []),
  ]
  const link = ([to, text, Icon, count]) => (
    <NavLink key={to} to={to} className="nav-link"><Icon size={19} /> {text} <Badge count={count} /></NavLink>
  )

  return (
    <div className={`shell ${showRail ? '' : 'no-rail'}`}>
      <nav className="sidebar" aria-label="Main">
        <Link to="/home" className="brand" aria-label="DevConnect home"><span>Dev</span><span>Connect</span></Link>
        {MAIN.map(link)}
        <div className="sidebar-section">You</div>
        {personal.map(link)}
        <div className="spacer" />
        <InstallButton className="btn block" />
        <div className="divider" />
        <div className="row" style={{ padding: '10px 6px 0' }}>
          <Link to={`/developers/${profile.username}`} className="row" style={{ flex: 1, minWidth: 0 }}>
            <Avatar profile={profile} size={34} />
            <div style={{ minWidth: 0 }}>
              <div className="ellipsis" style={{ fontWeight: 600, fontSize: '.88rem' }}>{profile.full_name || profile.username}</div>
              <div className="faint small ellipsis">@{profile.username}</div>
            </div>
          </Link>
          <button className="icon-btn" onClick={signOut} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="main">
        <div className="mobile-top">
          <Link to="/home" className="brand" aria-label="DevConnect home">DC</Link>
          <div style={{ flex: 1 }}><SearchBar placeholder="Search DevConnect" /></div>
          <Link to="/notifications" className="icon-btn" aria-label="Notifications" style={{ position: 'relative' }}>
            <Bell size={20} />{unread.notifications > 0 && <span className="dot" style={{ position: 'absolute', top: 4, right: 6 }} />}
          </Link>
          <Link to={`/developers/${profile.username}`} aria-label="My profile"><Avatar profile={profile} size={32} /></Link>
        </div>
        <div className="topbar">
          <SearchBar />
          <Link to="/notifications" className="btn icon" aria-label="Notifications" style={{ position: 'relative' }}>
            <Bell size={18} />{unread.notifications > 0 && <span className="dot" style={{ position: 'absolute', top: 6, right: 6 }} />}
          </Link>
          <Link to="/messages" className="btn icon" aria-label="Messages" style={{ position: 'relative' }}>
            <MessageSquare size={18} />{unread.messages > 0 && <span className="dot" style={{ position: 'absolute', top: 6, right: 6 }} />}
          </Link>
        </div>
        {profile.is_suspended && <div className="alert">Your account is suspended. You can browse, but you can't post, comment or message.</div>}
        <Outlet />
      </main>

      {showRail && <Rail />}

      <nav className="bottom-nav" aria-label="Mobile">
        {[['/home', 'Home', Home], ['/questions', 'Q&A', HelpCircle], ['/projects', 'Projects', FolderGit2],
          ['/messages', 'Chat', MessageSquare, unread.messages], ['/dashboard', 'Me', LayoutDashboard]].map(([to, text, Icon, count]) => (
          <NavLink key={to} to={to}><Icon size={20} />{text}<Badge count={count} /></NavLink>
        ))}
      </nav>
      <ReportHost />
    </div>
  )
}
