import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Live unread counters for the nav: notifications and chat messages.
export function useUnread(userId) {
  const [notifications, setNotifications] = useState(0)
  const [messages, setMessages] = useState(0)

  useEffect(() => {
    if (!userId) return
    const loadNotifs = () => supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_read', false).then(({ count }) => setNotifications(count || 0))
    const loadMsgs = () => supabase.rpc('my_conversations')
      .then(({ data }) => setMessages((data || []).reduce((n, c) => n + Number(c.unread), 0)))
    loadNotifs()
    loadMsgs()
    const channel = supabase.channel(`unread-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, loadNotifs)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadMsgs)
      .subscribe()
    // pages that mark things read broadcast this so counters refresh immediately
    const refresh = () => { loadNotifs(); loadMsgs() }
    window.addEventListener('unread-refresh', refresh)
    return () => { supabase.removeChannel(channel); window.removeEventListener('unread-refresh', refresh) }
  }, [userId])

  return { notifications, messages }
}

export const refreshUnread = () => window.dispatchEvent(new Event('unread-refresh'))
