import { useEffect, useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { refreshUnread } from '../hooks/useUnread'
import { Loader } from '../components/ui'
import NotificationList from '../components/NotificationList'

export const NOTIF_SELECT = `*, actor:profiles!notifications_actor_id_fkey(${PROFILE_FIELDS})`

export default function Notifications() {
  const { user } = useAuth()
  const toast = useToast()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data, setData, loading, error, reload } = useQuery(() => {
    let query = supabase.from('notifications').select(NOTIF_SELECT).eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
    if (unreadOnly) query = query.eq('is_read', false)
    return q(query)
  }, [user.id, unreadOnly])

  // new notifications appear live
  useEffect(() => {
    const channel = supabase.channel('notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, reload)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user.id, reload])

  const markRead = async (n) => {
    if (n.is_read) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setData((d) => d.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    refreshUnread()
  }
  const markAll = async () => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    if (error) return toast(error.message, 'error')
    setData((d) => d.map((x) => ({ ...x, is_read: true })))
    refreshUnread()
  }
  const remove = async (n) => {
    const { error } = await supabase.from('notifications').delete().eq('id', n.id)
    if (error) return toast(error.message, 'error')
    setData((d) => d.filter((x) => x.id !== n.id))
    refreshUnread()
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Notifications</h1><p>Follows, likes, answers, requests and messages.</p></div>
        <button className="btn" onClick={markAll}><CheckCheck size={16} /> Mark all as read</button>
      </div>
      <div className="tabs">
        <button className={`tab ${!unreadOnly ? 'active' : ''}`} onClick={() => setUnreadOnly(false)}>All</button>
        <button className={`tab ${unreadOnly ? 'active' : ''}`} onClick={() => setUnreadOnly(true)}>Unread</button>
      </div>
      <div className="card">
        <Loader loading={loading && !data} error={error} empty={!data?.length} emptyTitle="You're all caught up">
          {data && <NotificationList items={data} onOpen={markRead} onDelete={remove} />}
        </Loader>
      </div>
    </>
  )
}
