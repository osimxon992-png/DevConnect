import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, q, uploadFile } from '../lib/supabase'
import { PROJECT_STATUSES, ROLES } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field, Select, Spinner, TagInput } from '../components/ui'

const EMPTY = { name: '', description: '', github_url: '', demo_url: '', status: 'looking', team_size: 4 }

// /create-project and /create-project?edit=<id>
export default function ProjectForm() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const [form, setForm] = useState(EMPTY)
  const [technologies, setTechnologies] = useState([])
  const [roles, setRoles] = useState([])
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(Boolean(editId))
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    if (!editId) return
    supabase.from('projects').select('*').eq('id', editId).single().then(({ data, error }) => {
      if (error || data.owner_id !== user.id) { toast('You can only edit your own projects', 'error'); return navigate('/projects') }
      const { name, description, github_url, demo_url, status, team_size } = data
      setForm({ name, description, github_url, demo_url, status, team_size })
      setTechnologies(data.technologies)
      setRoles(data.required_roles)
      setImageUrl(data.image_url)
      setLoading(false)
    })
  }, [editId, user.id, navigate, toast])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const image_url = image ? await uploadFile(user.id, image, 'projects') : imageUrl
      const fields = { ...form, team_size: Number(form.team_size), technologies, required_roles: roles, image_url }
      const saved = editId
        ? await q(supabase.from('projects').update(fields).eq('id', editId).select('id').single())
        : await q(supabase.from('projects').insert({ ...fields, owner_id: user.id }).select('id').single())
      navigate(`/projects/${saved.id}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />
  const toggleRole = (r) => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r])
  return (
    <>
      <div className="page-head"><div><h1>{editId ? 'Edit project' : 'Create a project'}</h1><p>Describe what you're building and who you need.</p></div></div>
      <form className="card form-grid" onSubmit={submit}>
        <Field label="Project name" className="full"><input className="input" required value={form.name} onChange={set('name')} maxLength={80} /></Field>
        <Field label="Description" className="full"><textarea className="textarea" value={form.description} onChange={set('description')} style={{ minHeight: 130 }} /></Field>
        <Field label="Status"><Select options={PROJECT_STATUSES.map(([v, l]) => [v, l])} value={form.status} onChange={set('status')} /></Field>
        <Field label="Team size"><input className="input" type="number" min={1} max={100} value={form.team_size} onChange={set('team_size')} /></Field>
        <Field label="GitHub repository"><input className="input" value={form.github_url} onChange={set('github_url')} placeholder="https://github.com/…" /></Field>
        <Field label="Live demo"><input className="input" value={form.demo_url} onChange={set('demo_url')} placeholder="https://…" /></Field>
        <Field label="Project image" hint={imageUrl && !image ? 'Leave empty to keep the current image' : undefined}>
          <input type="file" accept="image/*" className="input" onChange={(e) => setImage(e.target.files[0] || null)} />
        </Field>
        <Field label="Technologies"><TagInput value={technologies} onChange={setTechnologies} placeholder="React, Node.js…" /></Field>
        <Field label="Roles you're looking for" className="full">
          <div className="row wrap">
            {ROLES.map((r) => (
              <button type="button" key={r} className={`chip clickable ${roles.includes(r) ? 'selected' : ''}`} onClick={() => toggleRole(r)} aria-pressed={roles.includes(r)}>{r}</button>
            ))}
          </div>
        </Field>
        <button className="btn primary full" disabled={busy}>{busy ? 'Saving…' : editId ? 'Save project' : 'Create project'}</button>
      </form>
    </>
  )
}
