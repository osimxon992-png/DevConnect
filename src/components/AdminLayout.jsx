import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, Flag, Users, FileText, HelpCircle, FolderGit2, UsersRound, Briefcase, ArrowLeft, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui'

export const ADMIN_NAV = [
  ['/admin', 'Overview', LayoutDashboard], ['/admin/reports', 'Reports', Flag], ['/admin/users', 'Users', Users],
  ['/admin/posts', 'Posts', FileText], ['/admin/questions', 'Questions', HelpCircle], ['/admin/projects', 'Projects', FolderGit2],
  ['/admin/groups', 'Groups', UsersRound], ['/admin/jobs', 'Jobs', Briefcase],
]

// Separate shell for the admin panel: own sidebar, no app rail/search, mobile gets a scrollable tab strip.
export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  return (
    <div className="shell no-rail admin-shell">
      <nav className="sidebar" aria-label="Admin">
        <Link to="/admin" className="brand" aria-label="Admin panel home"><span>Dev</span><span>Admin</span></Link>
        {ADMIN_NAV.map(([to, text, Icon]) => (
          <NavLink key={to} to={to} end={to === '/admin'} className="nav-link"><Icon size={19} /> {text}</NavLink>
        ))}
        <div className="spacer" />
        <NavLink to="/home" className="nav-link"><ArrowLeft size={19} /> Back to app</NavLink>
        <div className="divider" />
        <div className="row" style={{ padding: '10px 6px 0' }}>
          <div className="row" style={{ flex: 1, minWidth: 0 }}>
            <Avatar profile={profile} size={34} />
            <div style={{ minWidth: 0 }}>
              <div className="ellipsis" style={{ fontWeight: 600, fontSize: '.88rem' }}>{profile.full_name || profile.username}</div>
              <div className="faint small ellipsis">admin</div>
            </div>
          </div>
          <button className="icon-btn" onClick={signOut} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="main">
        <div className="mobile-top">
          <Link to="/admin" className="brand" aria-label="Admin panel home">DA</Link>
          <div style={{ flex: 1 }} />
          <Link to="/home" className="btn sm"><ArrowLeft size={15} /> App</Link>
        </div>
        <nav className="tabs admin-mobile-nav" aria-label="Admin sections">
          {ADMIN_NAV.map(([to, text]) => <NavLink key={to} to={to} end={to === '/admin'} className="tab">{text}</NavLink>)}
        </nav>
        <Outlet />
      </main>
    </div>
  )
}
