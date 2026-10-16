import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Trash2, FolderGit2 } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { refreshUnread } from '../hooks/useUnread'
import { Avatar, Spinner } from './ui'

export function MessageList({ messages, members, me, onDelete }) {
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [messages.length])
  return (
    <div className="chat-messages">
      {messages.length === 0 && <div className="empty small">No messages yet. Say hi 👋</div>}
      {messages.map((m, i) => {
        const mine = m.sender_id === me
        const sender = members[m.sender_id]
        const showName = !mine && messages[i - 1]?.sender_id !== m.sender_id
        return (
          <div key={m.id} className={`msg ${mine ? 'mine' : ''}`}>
            {showName && <span className="faint small">{sender?.full_name || sender?.username || 'former member'}</span>}
            <div className="bubble">{m.content}</div>
            <div className="meta">
              {timeAgo(m.created_at)}
              {mine && <button className="icon-btn" style={{ padding: 2 }} onClick={() => onDelete(m)} aria-label="Delete message"><Trash2 size={12} /></button>}
            </div>
          </div>
        )
      })}
      <div ref={end} />
    </div>
  )
}

export default function ChatWindow({ conversationId, onActivity }) {
  const { user } = useAuth()
  const toast = useToast()
  const [state, setState] = useState(null)
  const [text, setText] = useState('')

  useEffect(() => {
    let alive = true
    setState(null)
    const markRead = async () => {
      await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId).eq('user_id', user.id)
      await supabase.from('notifications').update({ is_read: true })
        .eq('user_id', user.id).eq('link', `/messages/${conversationId}`).eq('is_read', false)
      refreshUnread()
      onActivity?.()
    }
    ;(async () => {
      try {
        const [conv, rows, messages] = await Promise.all([
          q(supabase.from('conversations').select('*, project:projects(id, name, image_url)').eq('id', conversationId).single()),
          q(supabase.from('conversation_members').select(`user_id, profile:profiles(${PROFILE_FIELDS})`).eq('conversation_id', conversationId)),
          q(supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(200)),
        ])
        if (!alive) return
        const members = Object.fromEntries(rows.map((r) => [r.user_id, r.profile]))
        setState({ conv, members, messages: messages.reverse() })
        markRead()
      } catch (e) {
        if (alive) setState({ error: e })
      }
    })()

    const channel = supabase.channel(`chat-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, ({ new: m }) => {
        setState((s) => (s && !s.messages.some((x) => x.id === m.id) ? { ...s, messages: [...s.messages, m] } : s))
        if (m.sender_id !== user.id) markRead()
      })
      // under RLS, delete payloads only contain the id
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, ({ old }) => {
        setState((s) => s && { ...s, messages: s.messages.filter((x) => x.id !== old.id) })
      })
      .subscribe()
    return () => { alive = false; supabase.removeChannel(channel) }
  }, [conversationId, user.id, onActivity])

  const send = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    const { data, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, content }).select().single()
    if (error) { setText(content); return toast(error.message, 'error') }
    setState((s) => (s.messages.some((x) => x.id === data.id) ? s : { ...s, messages: [...s.messages, data] }))
    onActivity?.()
  }
  const remove = async (m) => {
    const { error } = await supabase.from('messages').delete().eq('id', m.id)
    if (error) return toast(error.message, 'error')
    setState((s) => ({ ...s, messages: s.messages.filter((x) => x.id !== m.id) }))
  }

  if (!state) return <div className="chat-window"><Spinner /></div>
  if (state.error) return <div className="chat-window"><div className="empty">This conversation is not available.</div></div>

  const { conv, members, messages } = state
  const other = !conv.project_id && Object.values(members).find((p) => p && p.id !== user.id)
  return (
    <div className="chat-window">
      <div className="chat-header">
        <Link to="/messages" className="icon-btn" aria-label="Back to conversations"><ArrowLeft size={18} /></Link>
        {conv.project ? (
          <Link to={`/projects/${conv.project.id}`} className="row">
            <span className="avatar" style={{ width: 36, height: 36, borderRadius: 10 }}><FolderGit2 size={18} /></span>
            <div><b>{conv.project.name}</b><div className="faint small">Team chat · {Object.keys(members).length} members</div></div>
          </Link>
        ) : other ? (
          <Link to={`/developers/${other.username}`} className="row">
            <Avatar profile={other} size={36} />
            <div><b>{other.full_name || other.username}</b><div className="faint small">@{other.username}</div></div>
          </Link>
        ) : <b>Conversation</b>}
      </div>
      <MessageList messages={messages} members={members} me={user.id} onDelete={remove} />
      <form className="chat-input" onSubmit={send}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" maxLength={4000} aria-label="Message" autoFocus />
        <button className="btn primary" disabled={!text.trim()} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  )
}
