import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { configured } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/ui'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Developers from './pages/Developers'
import Profile from './pages/Profile'
import PostPage from './pages/PostPage'
import Questions from './pages/Questions'
import QuestionPage from './pages/QuestionPage'
import Projects from './pages/Projects'
import ProjectPage from './pages/ProjectPage'
import ProjectForm from './pages/ProjectForm'
import Groups from './pages/Groups'
import GroupPage from './pages/GroupPage'
import Jobs from './pages/Jobs'
import JobPage from './pages/JobPage'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Saved from './pages/Saved'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

function Protected({ admin = false }) {
  const { session, profile, loading, recovery } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (recovery) return <Navigate to="/reset-password" replace />
  if (!profile) return <div className="auth-wrap single"><div className="alert">Your profile could not be loaded. Try logging out and in again.</div></div>
  if (admin && !profile.is_admin) return <Navigate to="/home" replace />
  return <Layout />
}

function PublicOnly({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  return session ? <Navigate to="/home" replace /> : children
}

export default function App() {
  if (!configured) {
    return (
      <div className="auth-wrap single">
        <div className="card auth-card stack">
          <h1>Connect Supabase</h1>
          <p className="muted">Copy <code>.env.example</code> to <code>.env</code>, fill in your Supabase URL and anon key, run <code>supabase/schema.sql</code> in the SQL editor, then restart <code>npm run dev</code>.</p>
        </div>
      </div>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Protected />}>
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/developers/:username" element={<Profile />} />
        <Route path="/posts/:id" element={<PostPage />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/questions/:id" element={<QuestionPage />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/create-project" element={<ProjectForm />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupPage />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobPage />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route element={<Protected admin />}>
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
