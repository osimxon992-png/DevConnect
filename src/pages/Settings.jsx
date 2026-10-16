import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, q, uploadFile } from '../lib/supabase'
import { LANGUAGES, LEVELS, NOTIFICATION_TYPES } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Field, Select, Spinner, TagInput } from '../components/ui'

const SECTIONS = [['profile', 'Profile'], ['account', 'Account'], ['notifications', 'Notifications'], ['privacy', 'Privacy'], ['danger', 'Delete account']]

export default function Settings() {
  const [section, setSection] = useState('profile')
  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p>Manage your profile, account and privacy.</p></div></div>
      <div className="tabs" role="tablist">
        {SECTIONS.map(([k, t]) => <button key={k} role="tab" aria-selected={section === k} className={`tab ${section === k ? 'active' : ''}`} onClick={() => setSection(k)}>{t}</button>)}
      </div>
      {section === 'profile' && <ProfileSettings />}
      {section === 'account' && <AccountSettings />}
      {section === 'notifications' && <NotificationSettings />}
      {section === 'privacy' && <PrivacySettings />}
      {section === 'danger' && <DeleteAccount />}
    </>
  )
}

function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    full_name: profile.full_name, bio: profile.bio, location: profile.location, level: profile.level,
    main_language: profile.main_language, github: profile.github, website: profile.website,
  })
  const [languages, setLanguages] = useState(profile.languages)
  const [avatar, setAvatar] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const { data: allSkills, setData: setAllSkills } = useQuery(() => q(supabase.from('skills').select('id, name').order('name')), [])
  const { data: mySkills, setData: setMySkills, loading } = useQuery(
    async () => (await q(supabase.from('user_skills').select('skills(name)').eq('user_id', user.id))).map((r) => r.skills.name), [user.id])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const avatar_url = avatar ? await uploadFile(user.id, avatar, 'avatars') : profile.avatar_url
      const langs = form.main_language && !languages.includes(form.main_language) ? [form.main_language, ...languages] : languages
      await q(supabase.from('profiles').update({ ...form, languages: langs, avatar_url }).eq('id', user.id))
      setLanguages(langs)

      // create unknown skills, then replace this user's skill links
      const known = new Map((allSkills || []).map((s) => [s.name.toLowerCase(), s]))
      const missing = mySkills.filter((n) => !known.has(n.toLowerCase()))
      if (missing.length) {
        const created = await q(supabase.from('skills').insert(missing.map((name) => ({ name }))).select('id, name'))
        created.forEach((s) => known.set(s.name.toLowerCase(), s))
        setAllSkills([...known.values()])
      }
      await q(supabase.from('user_skills').delete().eq('user_id', user.id))
      if (mySkills.length) {
        await q(supabase.from('user_skills').insert(mySkills.map((n) => ({ user_id: user.id, skill_id: known.get(n.toLowerCase()).id }))))
      }
      await refreshProfile()
      toast('Profile saved')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />
  return (
    <form className="card form-grid" onSubmit={save}>
      <div className="row full">
        <Avatar profile={avatar ? { ...profile, avatar_url: URL.createObjectURL(avatar) } : profile} size={72} />
        <Field label="Profile photo" hint="PNG or JPG, under 5 MB"><input type="file" accept="image/*" className="input" onChange={(e) => setAvatar(e.target.files[0] || null)} /></Field>
      </div>
      <Field label="Full name"><input className="input" value={form.full_name} onChange={set('full_name')} maxLength={80} /></Field>
      <Field label="Location"><input className="input" value={form.location} onChange={set('location')} /></Field>
      <Field label="Developer level"><Select options={LEVELS} value={form.level} onChange={set('level')} /></Field>
      <Field label="Main language"><Select options={[['', '—'], ...LANGUAGES]} value={form.main_language} onChange={set('main_language')} /></Field>
      <Field label="GitHub username or link"><input className="input" value={form.github} onChange={set('github')} placeholder="octocat" /></Field>
      <Field label="Website / portfolio"><input className="input" value={form.website} onChange={set('website')} placeholder="https://…" /></Field>
      <Field label="Bio" className="full"><textarea className="textarea" value={form.bio} onChange={set('bio')} maxLength={300} /></Field>
      <Field label="Programming languages" className="full"><TagInput value={languages} onChange={setLanguages} suggestions={LANGUAGES} /></Field>
      <Field label="Skills" className="full" hint="Pick from the list or type your own">
        <TagInput value={mySkills} onChange={setMySkills} suggestions={(allSkills || []).map((s) => s.name)} />
      </Field>
      <button className="btn primary full" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  )
}

function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')

  const run = async (fn, okText) => {
    try { await fn(); toast(okText) } catch (err) { toast(err.message, 'error') }
  }
  const saveUsername = (e) => {
    e.preventDefault()
    run(async () => {
      const name = username.toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(name)) throw new Error('Username must be 3–20 characters: letters, numbers or _.')
      const { error } = await supabase.from('profiles').update({ username: name }).eq('id', user.id)
      if (error) throw new Error(error.code === '23505' ? 'That username is taken.' : error.message)
      await refreshProfile()
    }, 'Username updated')
  }
  const saveEmail = (e) => {
    e.preventDefault()
    run(async () => { const { error } = await supabase.auth.updateUser({ email }); if (error) throw error }, 'Check both inboxes to confirm the new email')
  }
  const savePassword = (e) => {
    e.preventDefault()
    run(async () => {
      if (password.length < 8) throw new Error('Password must be at least 8 characters.')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword('')
    }, 'Password updated')
  }
  return (
    <div className="stack">
      <form className="card stack" onSubmit={saveUsername}>
        <h3>Username</h3>
        <div className="row"><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} aria-label="Username" /><button className="btn">Save</button></div>
      </form>
      <form className="card stack" onSubmit={saveEmail}>
        <h3>Email</h3>
        <div className="row"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" /><button className="btn">Change</button></div>
      </form>
      <form className="card stack" onSubmit={savePassword}>
        <h3>Password</h3>
        <div className="row"><input className="input" type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="New password" /><button className="btn">Update</button></div>
      </form>
    </div>
  )
}

function NotificationSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [prefs, setPrefs] = useState(profile.notification_prefs || {})
  const toggle = async (type) => {
    const next = { ...prefs, [type]: prefs[type] === false }
    setPrefs(next)
    const { error } = await supabase.from('profiles').update({ notification_prefs: next }).eq('id', user.id)
    if (error) return toast(error.message, 'error')
    refreshProfile()
  }
  return (
    <div className="card stack">
      <p className="muted" style={{ margin: 0 }}>Choose which activity creates notifications for you.</p>
      {NOTIFICATION_TYPES.map(([type, text]) => (
        <label key={type} className="check"><input type="checkbox" checked={prefs[type] !== false} onChange={() => toggle(type)} /> {text}</label>
      ))}
    </div>
  )
}

function PrivacySettings() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const set = async (is_private) => {
    const { error } = await supabase.from('profiles').update({ is_private }).eq('id', user.id)
    if (error) return toast(error.message, 'error')
    await refreshProfile()
    toast(is_private ? 'Profile is now private' : 'Profile is now public')
  }
  return (
    <div className="card stack">
      <label className="check"><input type="radio" name="privacy" checked={!profile.is_private} onChange={() => set(false)} />
        <span><b>Public profile</b><br /><span className="muted small">Anyone on DevConnect can see your posts and details.</span></span></label>
      <label className="check"><input type="radio" name="privacy" checked={profile.is_private} onChange={() => set(true)} />
        <span><b>Private profile</b><br /><span className="muted small">Only your followers can see your feed posts, bio and links. Your name and avatar stay visible.</span></span></label>
    </div>
  )
}

function DeleteAccount() {
  const { profile, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const remove = async () => {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) return toast(error.message, 'error')
    await signOut()
    navigate('/')
  }
  return (
    <div className="card stack">
      <h3>Delete account</h3>
      <p className="muted" style={{ margin: 0 }}>This permanently deletes your profile, posts, comments, projects you own and messages. It cannot be undone.</p>
      <Field label={`Type ${profile.username} to confirm`}><input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} /></Field>
      <button className="btn danger" disabled={confirmText !== profile.username} onClick={remove}>Delete my account</button>
    </div>
  )
}
