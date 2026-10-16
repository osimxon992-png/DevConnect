import { useState } from 'react'
import { Flame, Heart, Sparkles, Clock } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { POST_SELECT, loadPosts } from '../lib/posts'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Loader } from '../components/ui'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'

const TABS = [['foryou', 'For you', Sparkles], ['following', 'Following', Heart], ['trending', 'Trending', Flame], ['latest', 'Latest', Clock]]
// shortcut: fixed page size without pagination; add range() + "load more" when feeds grow large
const LIMIT = 30

export default function Home() {
  const { user } = useAuth()
  const [tab, setTab] = useState('foryou')

  const { data: posts, setData, loading, error } = useQuery(async () => {
    const base = () => supabase.from('posts').select(POST_SELECT).is('group_id', null).limit(LIMIT)
    const follows = await q(supabase.from('follows').select('following_id').eq('follower_id', user.id))
    const ids = [user.id, ...follows.map((f) => f.following_id)]
    const followed = () => base().in('author_id', ids).order('created_at', { ascending: false })

    if (tab === 'following') return loadPosts(followed(), user.id)
    if (tab === 'latest') return loadPosts(base().order('created_at', { ascending: false }), user.id)
    if (tab === 'trending') return loadPosts(base().order('likes_count', { ascending: false }).order('created_at', { ascending: false }), user.id)

    // For you: people you follow first, then popular posts from everyone else.
    const [mine, recommended] = await Promise.all([
      q(followed()),
      q(base().not('author_id', 'in', `(${ids.join(',')})`).order('likes_count', { ascending: false }).order('created_at', { ascending: false })),
    ])
    return loadPosts(Promise.resolve({ data: [...mine, ...recommended] }), user.id)
  }, [tab, user.id])

  return (
    <>
      <PostComposer onSaved={(p) => setData((ps) => [p, ...(ps || [])])} />
      <div className="tabs" role="tablist">
        {TABS.map(([key, text, Icon]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <Icon size={15} /> {text}
          </button>
        ))}
      </div>
      <Loader loading={loading} error={error} empty={!posts?.length} emptyTitle="Your feed is quiet"
        emptyText="Follow developers or write your first post to get things going.">
        <div className="stack">
          {posts?.map((p) => <PostCard key={p.id} post={p} onDeleted={(id) => setData((ps) => ps.filter((x) => x.id !== id))} />)}
        </div>
      </Loader>
    </>
  )
}
