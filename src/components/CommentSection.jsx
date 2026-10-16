import { useState } from 'react'
import { Heart, Reply, Trash2 } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Spinner, UserLink } from './ui'
import { openReport } from './actions'

// Threaded comments for a post, question or answer. `target` is e.g. { post_id: '…' }.
export default function CommentSection({ target, canModerate = false, onCountChange }) {
  const { user } = useAuth()
  const toast = useToast()
  const [col, id] = Object.entries(target)[0]
  const { data: comments, setData, loading } = useQuery(async () => {
    const rows = await q(supabase.from('comments').select(`*, author:profiles!author_id(${PROFILE_FIELDS})`).eq(col, id).order('created_at'))
    if (!rows.length) return rows
    const likes = await q(supabase.from('comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', rows.map((c) => c.id)))
    const liked = new Set(likes.map((l) => l.comment_id))
    return rows.map((c) => ({ ...c, liked: liked.has(c.id) }))
  }, [col, id, user.id])

  const add = async (content, parentId = null) => {
    const { data, error } = await supabase.from('comments')
      .insert({ [col]: id, content, parent_id: parentId, author_id: user.id })
      .select(`*, author:profiles!author_id(${PROFILE_FIELDS})`).single()
    if (error) { toast(error.message, 'error'); return false }
    setData((cs) => [...cs, { ...data, liked: false }])
    onCountChange?.(1)
    return true
  }

  const remove = async (c) => {
    if (!confirm('Delete this comment?')) return
    const { error } = await supabase.from('comments').delete().eq('id', c.id)
    if (error) return toast(error.message, 'error')
    // replies cascade in the database; drop them locally too
    const gone = new Set([c.id])
    let grew = true
    while (grew) {
      grew = false
      comments.forEach((x) => { if (x.parent_id && gone.has(x.parent_id) && !gone.has(x.id)) { gone.add(x.id); grew = true } })
    }
    setData((cs) => cs.filter((x) => !gone.has(x.id)))
    onCountChange?.(-gone.size)
  }

  const like = async (c) => {
    const { error } = c.liked
      ? await supabase.from('comment_likes').delete().eq('comment_id', c.id).eq('user_id', user.id)
      : await supabase.from('comment_likes').insert({ comment_id: c.id, user_id: user.id })
    if (error) return toast(error.message, 'error')
    setData((cs) => cs.map((x) => (x.id === c.id ? { ...x, liked: !c.liked, likes_count: x.likes_count + (c.liked ? -1 : 1) } : x)))
  }

  if (loading) return <Spinner />
  const children = (pid) => comments.filter((c) => c.parent_id === pid)
  const render = (c, depth = 0) => (
    <CommentItem key={c.id} c={c} me={user.id} canModerate={canModerate} onLike={like} onDelete={remove}
      onReply={(text) => add(text, c.id)}>
      {children(c.id).length > 0 && <div className="replies" style={depth >= 3 ? { marginLeft: 0 } : undefined}>{children(c.id).map((r) => render(r, depth + 1))}</div>}
    </CommentItem>
  )
  return (
    <div className="stack" style={{ gap: 12 }}>
      <CommentForm onSubmit={(text) => add(text)} />
      {children(null).map((c) => render(c))}
    </div>
  )
}

function CommentForm({ onSubmit, placeholder = 'Write a comment…', autoFocus, onDone }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <form className="row" onSubmit={async (e) => {
      e.preventDefault()
      if (!text.trim()) return
      setBusy(true)
      if (await onSubmit(text.trim())) { setText(''); onDone?.() }
      setBusy(false)
    }}>
      <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={2000} autoFocus={autoFocus} aria-label={placeholder} />
      <button className="btn sm" disabled={busy || !text.trim()}>Send</button>
    </form>
  )
}

function CommentItem({ c, me, canModerate, onLike, onDelete, onReply, children }) {
  const [replying, setReplying] = useState(false)
  return (
    <div>
      <div className="comment">
        <Avatar profile={c.author} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="comment-bubble">
            <div className="row small" style={{ gap: 6 }}>
              <UserLink profile={c.author}><b>{c.author?.full_name || c.author?.username}</b></UserLink>
              <span className="faint">· {timeAgo(c.created_at)}</span>
            </div>
            <div className="prewrap">{c.content}</div>
          </div>
          <div className="row" style={{ gap: 0 }}>
            <button className={`icon-btn small ${c.liked ? 'on' : ''}`} onClick={() => onLike(c)} aria-pressed={c.liked}>
              <Heart size={14} fill={c.liked ? 'currentColor' : 'none'} /> {c.likes_count}
            </button>
            <button className="icon-btn small" onClick={() => setReplying(!replying)}><Reply size={14} /> Reply</button>
            {(c.author_id === me || canModerate) && <button className="icon-btn small" onClick={() => onDelete(c)}><Trash2 size={14} /> Delete</button>}
            {c.author_id !== me && <button className="icon-btn small" onClick={() => openReport('comment', c.id)}>Report</button>}
          </div>
          {replying && <CommentForm onSubmit={onReply} placeholder={`Reply to @${c.author?.username}`} autoFocus onDone={() => setReplying(false)} />}
        </div>
      </div>
      {children}
    </div>
  )
}
