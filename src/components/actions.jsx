import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Flag, MessageSquare, UserCheck, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { REPORT_REASONS } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field, Modal, Select } from './ui'

export function FollowButton({ userId, initial, onChange, size = '' }) {
  const { user } = useAuth()
  const toast = useToast()
  const [following, setFollowing] = useState(initial)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (initial !== undefined || !user) return
    supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
      .then(({ data }) => setFollowing(Boolean(data)))
  }, [userId, initial, user])

  if (!user || user.id === userId) return null
  const toggle = async () => {
    setBusy(true)
    const { error } = following
      ? await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId)
      : await supabase.from('follows').insert({ follower_id: user.id, following_id: userId })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setFollowing(!following)
    onChange?.(!following)
  }
  return (
    <button className={`btn ${following ? '' : 'primary'} ${size}`} onClick={toggle} disabled={busy || following === undefined}>
      {following ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
    </button>
  )
}

export function MessageButton({ userId, size = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  if (!user || user.id === userId) return null
  const start = async () => {
    const { data, error } = await supabase.rpc('get_or_create_dm', { other: userId })
    if (error) return toast(error.message, 'error')
    navigate(`/messages/${data}`)
  }
  return <button className={`btn ${size}`} onClick={start}><MessageSquare size={16} /> Message</button>
}

const SAVE_TABLES = {
  post: ['saved_posts', 'post_id'],
  question: ['saved_questions', 'question_id'],
  project: ['saved_projects', 'project_id'],
  job: ['saved_jobs', 'job_id'],
}

export function SaveButton({ type, id, withLabel }) {
  const { user } = useAuth()
  const toast = useToast()
  const [table, col] = SAVE_TABLES[type]
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from(table).select(col).eq('user_id', user.id).eq(col, id).maybeSingle().then(({ data }) => setSaved(Boolean(data)))
  }, [table, col, id, user.id])

  const toggle = async () => {
    const { error } = saved
      ? await supabase.from(table).delete().eq('user_id', user.id).eq(col, id)
      : await supabase.from(table).insert({ user_id: user.id, [col]: id })
    if (error) return toast(error.message, 'error')
    setSaved(!saved)
    toast(saved ? 'Removed from saved' : 'Saved')
  }
  return (
    <button className={`icon-btn ${saved ? 'on' : ''}`} onClick={toggle} aria-label={saved ? 'Unsave' : 'Save'} aria-pressed={saved}>
      <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{withLabel && (saved ? 'Saved' : 'Save')}
    </button>
  )
}

export function ReportModal({ type, id, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_type: type, target_id: id, reason, details })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast('Report sent. Thanks for keeping DevConnect safe.')
    onClose()
  }
  return (
    <Modal title={`Report ${type}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Reason"><Select options={REPORT_REASONS} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Field label="Details (optional)"><textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} /></Field>
        <button className="btn danger" disabled={busy}><Flag size={16} /> Submit report</button>
      </form>
    </Modal>
  )
}

// Menus unmount on click, so the report modal lives in one host mounted by the Layout.
export const openReport = (type, id) => window.dispatchEvent(new CustomEvent('open-report', { detail: { type, id } }))

export function ReportItem({ type, id }) {
  return <button className="danger" onClick={() => openReport(type, id)}><Flag size={15} /> Report</button>
}

export function ReportHost() {
  const [target, setTarget] = useState(null)
  useEffect(() => {
    const open = (e) => setTarget(e.detail)
    window.addEventListener('open-report', open)
    return () => window.removeEventListener('open-report', open)
  }, [])
  return target && <ReportModal {...target} onClose={() => setTarget(null)} />
}
