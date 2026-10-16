import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, Shield, UserMinus } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { POST_SELECT, loadPosts } from '../lib/posts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Empty, Loader, Menu, Spinner } from '../components/ui'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'
import UserCard from '../components/UserCard'
import { GROUP_SELECT, GroupForm, toggleMembership } from './Groups'

export default function GroupPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('posts')
  const [editing, setEditing] = useState(false)

  const { data, loading, error, reload } = useQuery(async () => {
    const group = await q(supabase.from('groups').select(GROUP_SELECT).eq('id', id).maybeSingle())
    if (!group) return null
    const members = await q(supabase.from('group_members').select(`role, user_id, profile:profiles(${PROFILE_FIELDS})`).eq('group_id', id).order('joined_at'))
    return { group, members }
  }, [id])

  const posts = useQuery(() => loadPosts(
    supabase.from('posts').select(POST_SELECT).eq('group_id', id).order('created_at', { ascending: false }).limit(50), user.id,
  ), [id, user.id])

  if (loading && !data) return <Spinner />
  if (error || !data) return <Empty title="Group not found">{error?.message}</Empty>

  const { group: g, members } = data
  const me = members.find((m) => m.user_id === user.id)
  const isAdmin = me?.role === 'admin' || profile.is_admin

  const run = async (promise, ok) => {
    const { error } = await promise
    if (error) return toast(error.message, 'error')
    if (ok) toast(ok)
    reload()
  }
  const removeGroup = async () => {
    if (!confirm('Delete this group and all its posts?')) return
    const { error } = await supabase.from('groups').delete().eq('id', g.id)
    if (error) return toast(error.message, 'error')
    navigate('/groups')
  }

  return (
    <>
      <div className="card media-card">
        <div className="cover" style={{ height: 160 }}>
          {g.image_url ? <img src={g.image_url} alt="" /> : <span className="glyph">{g.name}</span>}
        </div>
        <div className="body" style={{ padding: 20 }}>
          <div className="row between wrap">
            <h1 style={{ margin: 0 }}>{g.name}</h1>
            <div className="row">
              <button className={`btn ${me ? '' : 'primary'}`} onClick={() => run(toggleMembership(g.id, user.id, Boolean(me)), me ? 'Left group' : 'Joined group')}>
                {me ? 'Leave group' : 'Join group'}
              </button>
              {isAdmin && (
                <Menu>
                  <button onClick={() => setEditing(true)}><Pencil size={15} /> Edit group</button>
                  <button className="danger" onClick={removeGroup}><Trash2 size={15} /> Delete group</button>
                </Menu>
              )}
            </div>
          </div>
          <p className="prewrap" style={{ display: 'block' }}>{g.description}</p>
          <span className="muted small">{members.length} members</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {[['posts', 'Posts'], ['members', `Members · ${members.length}`]].map(([k, t]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>

      {tab === 'posts' && (
        <>
          {me ? <PostComposer groupId={g.id} onSaved={(p) => posts.setData((ps) => [p, ...ps])} />
            : <div className="card muted small">Join the group to post.</div>}
          <Loader loading={posts.loading} error={posts.error} empty={!posts.data?.length} emptyTitle="No posts in this group yet">
            <div className="stack">
              {posts.data?.map((p) => <PostCard key={p.id} post={p} canModerate={isAdmin} onDeleted={(pid) => posts.setData((ps) => ps.filter((x) => x.id !== pid))} />)}
            </div>
          </Loader>
        </>
      )}

      {tab === 'members' && (
        <div className="card">
          {members.map((m) => (
            <UserCard key={m.user_id} user={m.profile} subtitle={m.role === 'admin' ? 'Group admin' : `@${m.profile?.username}`}
              follow={m.user_id !== user.id}
              action={isAdmin && m.user_id !== user.id && (
                <Menu>
                  <button onClick={() => run(supabase.from('group_members').update({ role: m.role === 'admin' ? 'member' : 'admin' }).eq('group_id', g.id).eq('user_id', m.user_id), 'Role updated')}>
                    <Shield size={15} /> {m.role === 'admin' ? 'Remove admin' : 'Make admin'}
                  </button>
                  <button className="danger" onClick={() => run(supabase.from('group_members').delete().eq('group_id', g.id).eq('user_id', m.user_id), 'Member removed')}>
                    <UserMinus size={15} /> Remove from group
                  </button>
                </Menu>
              )} />
          ))}
        </div>
      )}
      {editing && <GroupForm group={g} onClose={() => setEditing(false)} onSaved={reload} />}
    </>
  )
}
