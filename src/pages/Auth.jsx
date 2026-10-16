import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, uploadFile } from '../lib/supabase'
import { LANGUAGES, LEVELS } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { Field, Select } from '../components/ui'

function AuthShell({ title, subtitle, wide, children }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <Link to="/" className="brand"><span>Dev</span><span>Connect</span></Link>
        <p>The noticeboard for developers: share code, ask questions, find a team.</p>
      </aside>
      <main className="auth-main">
        <div className={`auth-card stack ${wide ? 'wide' : ''}`} style={{ gap: 20 }}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="muted" style={{ margin: 0 }}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword(form)
    setBusy(false)
    if (error) return setError(error.message)
    navigate(location.state?.from || '/home', { replace: true })
  }
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue building with developers.">
      <form className="stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <Field label="Email"><input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <div className="row between small">
          <Link to="/forgot-password" className="muted">Forgot password?</Link>
        </div>
        <button className="btn primary block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>New here? <Link to="/register" className="link">Create an account</Link></p>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [form, setForm] = useState({
    username: '', full_name: '', email: '', password: '', bio: '', location: '', level: 'junior', main_language: 'JavaScript',
  })
  const [avatar, setAvatar] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const username = form.username.toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return setError('Username must be 3–20 characters: letters, numbers or _.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setBusy(true)
    try {
      const { data: available, error: rpcErr } = await supabase.rpc('username_available', { name: username })
      if (rpcErr) throw rpcErr
      if (!available) throw new Error('That username is taken.')
      const { email, password, ...meta } = form
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { ...meta, username }, emailRedirectTo: `${window.location.origin}/home` },
      })
      if (error) throw error
      if (data.session) {
        if (avatar) {
          const url = await uploadFile(data.user.id, avatar, 'avatars')
          await supabase.from('profiles').update({ avatar_url: url }).eq('id', data.user.id)
          refreshProfile()
        }
        navigate('/home', { replace: true })
      } else {
        setDone(true) // email confirmation is enabled in Supabase
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Check your inbox" subtitle={`We sent a confirmation link to ${form.email}.`}>
        <p className="muted small">After confirming, log in and add your profile photo in Settings.</p>
        <Link to="/login" className="btn primary">Go to login</Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Join DevConnect" subtitle="Create your developer profile." wide>
      <form className="form-grid" onSubmit={submit}>
        {error && <div className="alert full">{error}</div>}
        <Field label="Username" hint="Unique, lowercase. Example: dev_ali"><input className="input" required value={form.username} onChange={set('username')} autoComplete="username" /></Field>
        <Field label="Full name"><input className="input" required value={form.full_name} onChange={set('full_name')} autoComplete="name" /></Field>
        <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password" hint="At least 8 characters"><input className="input" type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Developer level"><Select options={LEVELS} value={form.level} onChange={set('level')} /></Field>
        <Field label="Main programming language"><Select options={LANGUAGES} value={form.main_language} onChange={set('main_language')} /></Field>
        <Field label="Location"><input className="input" value={form.location} onChange={set('location')} placeholder="Tashkent, Uzbekistan" /></Field>
        <Field label="Profile photo"><input className="input" type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0] || null)} /></Field>
        <Field label="Short bio" className="full"><textarea className="textarea" maxLength={300} value={form.bio} onChange={set('bio')} placeholder="What do you build?" /></Field>
        <button className="btn primary block full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="muted small full" style={{ textAlign: 'center', margin: 0 }}>Already have an account? <Link to="/login" className="link">Log in</Link></p>
      </form>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) return setError(error.message)
    setSent(true)
  }
  return (
    <AuthShell title="Reset password" subtitle="We'll email you a link to set a new password.">
      {sent ? <div className="alert ok">If an account exists for {email}, a reset link is on its way.</div> : (
        <form className="stack" onSubmit={submit}>
          {error && <div className="alert">{error}</div>}
          <Field label="Email"><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <button className="btn primary block">Send reset link</button>
        </form>
      )}
      <Link to="/login" className="muted small">Back to login</Link>
    </AuthShell>
  )
}

export function ResetPassword() {
  const { session, clearRecovery } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setError(error.message)
    clearRecovery()
    navigate('/home', { replace: true })
  }
  if (session === undefined) return null
  return (
    <AuthShell title="Choose a new password">
      {!session ? <div className="alert">This reset link is invalid or has expired. <Link to="/forgot-password">Request a new one</Link>.</div> : (
        <form className="stack" onSubmit={submit}>
          {error && <div className="alert">{error}</div>}
          <Field label="New password"><input className="input" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <button className="btn primary block">Update password</button>
        </form>
      )}
    </AuthShell>
  )
}
