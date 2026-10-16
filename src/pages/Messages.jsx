import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FolderGit2, MessageSquare } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { timeAgo } from '../lib/utils'
import { useQuery } from '../hooks/useQuery'
import { Avatar, Empty, Spinner } from '../components/ui'
import ChatWindow from '../components/ChatWindow'

export default function Messages() {
  const { id } = useParams()
  const { data: convs, loading, reload } = useQuery(() => q(supabase.rpc('my_conversations')), [])

  // refresh previews and unread counts whenever any of my conversations gets a message
  useEffect(() => {
    const channel = supabase.channel('conversation-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, reload)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [reload])

  return (
    <div className={`card chat ${id ? 'has-active' : ''}`}>
      <div className="chat-list">
        <div className="chat-header"><h3 style={{ margin: 0 }}>Messages</h3></div>
        {loading && !convs ? <Spinner /> : convs?.length === 0 ? (
          <Empty icon={MessageSquare} title="No conversations">Open a developer's profile and press Message.</Empty>
        ) : convs?.map((c) => (
          <Link key={c.id} to={`/messages/${c.id}`} className={`chat-item ${c.id === id ? 'active' : ''}`}>
            {c.project_id
              ? <span className="avatar" style={{ width: 44, height: 44, borderRadius: 12 }}><FolderGit2 size={20} /></span>
              : <Avatar profile={{ username: c.other_username, full_name: c.other_name, avatar_url: c.other_avatar }} size={44} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row between">
                <b className="ellipsis">{c.project_id ? c.title : c.other_name || c.other_username || 'Deleted user'}</b>
                <span className="faint small" style={{ flexShrink: 0 }}>{c.last_message ? timeAgo(c.last_message_at) : ''}</span>
              </div>
              <div className="row between">
                <span className="muted small ellipsis">{c.last_message || (c.project_id ? 'Team chat' : 'No messages yet')}</span>
                {Number(c.unread) > 0 && <span className="count">{c.unread}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {id ? <ChatWindow key={id} conversationId={id} onActivity={reload} />
        : <div className="chat-window"><Empty icon={MessageSquare} title="Select a conversation" /></div>}
    </div>
  )
}
