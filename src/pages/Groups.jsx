import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase, q, uploadFile } from '../lib/supabase'
import { like } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Field, Loader, Modal } from '../components/ui'
import GroupCard from '../components/GroupCard'

export const GROUP_SELECT = '*, group_members(count)'

export async function toggleMembership(groupId, userId, joined) {
  return joined
    ? supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    : supabase.from('group_members').insert({ group_id: groupId, user_id: userId })
}

export default function Groups() {
  const { user } = useAuth()
  const toast = useToast()
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const { data, loading, error, reload } = useQuery(async () => {
    let query = supabase.from('groups').select(GROUP_SELECT).order('name')
    if (search) query = query.ilike('name', like(search))
    const [groups, mine] = await Promise.all([q(query), q(supabase.from('group_members').select('group_id').eq('user_id', user.id))])
    const set = new Set(mine.map((m) => m.group_id))
    return groups.map((g) => ({ ...g, joined: set.has(g.id) }))
  }, [search, user.id])

  const toggle = async (g) => {
    const { error } = await toggleMembership(g.id, user.id, g.joined)
    if (error) return toast(error.message, 'error')
    toast(g.joined ? `Left ${g.name}` : `Joined ${g.name}`)
    reload()
  }

  const joined = data?.filter((g) => g.joined) || []
  const others = data?.filter((g) => !g.joined) || []
  return (
    <>
      <div className="page-head">
        <div><h1>Groups</h1><p>Communities around languages, levels and places.</p></div>
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} /> Create group</button>
      </div>
      <form className="card" onSubmit={(e) => { e.preventDefault(); setSearch(text.trim()) }}>
        <input className="input" placeholder="Search groups" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search groups" />
      </form>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No groups found">
        {joined.length > 0 && <>
          <h2 style={{ margin: 0 }}>Your groups</h2>
          <div className="grid">{joined.map((g) => <GroupCard key={g.id} group={g} joined onToggle={() => toggle(g)} />)}</div>
        </>}
        {others.length > 0 && <>
          <h2 style={{ margin: 0 }}>Discover</h2>
          <div className="grid">{others.map((g) => <GroupCard key={g.id} group={g} joined={false} onToggle={() => toggle(g)} />)}</div>
        </>}
      </Loader>
      {creating && <GroupForm onClose={() => setCreating(false)} />}
    </>
  )
}

// Create, or edit when `group` is given.
export function GroupForm({ group, onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const image_url = image ? await uploadFile(user.id, image, 'groups') : group?.image_url ?? null
      const fields = { name: name.trim(), description, image_url }
      const saved = group
        ? await q(supabase.from('groups').update(fields).eq('id', group.id).select().single())
        : await q(supabase.from('groups').insert({ ...fields, created_by: user.id }).select().single())
      onClose()
      group ? onSaved?.() : navigate(`/groups/${saved.id}`)
    } catch (err) {
      toast(err.code === '23505' ? 'A group with that name already exists' : err.message, 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={group ? 'Edit group' : 'Create group'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Name"><input className="input" required minLength={3} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Description"><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Cover image"><input type="file" accept="image/*" className="input" onChange={(e) => setImage(e.target.files[0] || null)} /></Field>
        <button className="btn primary" disabled={busy}>{group ? 'Save' : 'Create'}</button>
      </form>
    </Modal>
  )
}
