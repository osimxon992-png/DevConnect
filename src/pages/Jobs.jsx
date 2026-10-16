import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { EMPLOYMENT_TYPES, WORK_MODES } from '../lib/constants'
import { like } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Field, Loader, Modal, Select, TagInput } from '../components/ui'
import JobCard from '../components/JobCard'

export default function Jobs() {
  const [filters, setFilters] = useState({ text: '', work_mode: '', employment_type: '', tech: '' })
  const [applied, setApplied] = useState(filters)
  const [creating, setCreating] = useState(false)
  const set = (k, v) => { const next = { ...filters, [k]: v }; setFilters(next); if (k === 'work_mode' || k === 'employment_type') setApplied(next) }

  const { data, loading, error } = useQuery(() => {
    let query = supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(60)
    if (applied.text) query = query.or(`title.ilike.${like(applied.text)},company.ilike.${like(applied.text)},location.ilike.${like(applied.text)}`)
    if (applied.work_mode) query = query.eq('work_mode', applied.work_mode)
    if (applied.employment_type) query = query.eq('employment_type', applied.employment_type)
    if (applied.tech) query = query.contains('technologies', [applied.tech.trim()])
    return q(query)
  }, [applied])

  return (
    <>
      <div className="page-head">
        <div><h1>Jobs</h1><p>Developer roles posted by companies and the community.</p></div>
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} /> Post a job</button>
      </div>
      <form className="card form-grid" onSubmit={(e) => { e.preventDefault(); setApplied(filters) }}>
        <input className="input" placeholder="Title, company or location" value={filters.text} onChange={(e) => set('text', e.target.value)} aria-label="Search jobs" />
        <input className="input" placeholder="Technology (exact, e.g. React)" value={filters.tech} onChange={(e) => set('tech', e.target.value)} aria-label="Technology" />
        <Select options={[['', 'Remote / On-site / Hybrid'], ...WORK_MODES]} value={filters.work_mode} onChange={(e) => set('work_mode', e.target.value)} aria-label="Work mode" />
        <Select options={[['', 'Any employment type'], ...EMPLOYMENT_TYPES]} value={filters.employment_type} onChange={(e) => set('employment_type', e.target.value)} aria-label="Employment type" />
        <button className="btn full">Search</button>
      </form>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No jobs found">
        <div className="grid wide">{data?.map((j) => <JobCard key={j.id} job={j} />)}</div>
      </Loader>
      {creating && <JobForm onClose={() => setCreating(false)} />}
    </>
  )
}

// Create, or edit when `job` is given.
export function JobForm({ job, onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: job?.title || '', company: job?.company || '', description: job?.description || '', requirements: job?.requirements || '',
    salary: job?.salary || '', location: job?.location || '', work_mode: job?.work_mode || 'remote',
    employment_type: job?.employment_type || 'full_time', apply_url: job?.apply_url || '',
  })
  const [technologies, setTechnologies] = useState(job?.technologies || [])
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    if (!/^https?:\/\//.test(form.apply_url)) return toast('Application link must start with http:// or https://', 'error')
    setBusy(true)
    try {
      const fields = { ...form, technologies }
      const saved = job
        ? await q(supabase.from('jobs').update(fields).eq('id', job.id).select().single())
        : await q(supabase.from('jobs').insert({ ...fields, posted_by: user.id }).select().single())
      onClose()
      job ? onSaved?.() : navigate(`/jobs/${saved.id}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={job ? 'Edit job' : 'Post a job'} onClose={onClose} wide>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Job title"><input className="input" required value={form.title} onChange={set('title')} /></Field>
        <Field label="Company"><input className="input" required value={form.company} onChange={set('company')} /></Field>
        <Field label="Work mode"><Select options={WORK_MODES} value={form.work_mode} onChange={set('work_mode')} /></Field>
        <Field label="Employment type"><Select options={EMPLOYMENT_TYPES} value={form.employment_type} onChange={set('employment_type')} /></Field>
        <Field label="Location"><input className="input" value={form.location} onChange={set('location')} /></Field>
        <Field label="Salary"><input className="input" value={form.salary} onChange={set('salary')} placeholder="$2,000 – $3,000 / month" /></Field>
        <Field label="Description" className="full"><textarea className="textarea" required value={form.description} onChange={set('description')} /></Field>
        <Field label="Requirements" className="full"><textarea className="textarea" value={form.requirements} onChange={set('requirements')} /></Field>
        <Field label="Technologies" className="full"><TagInput value={technologies} onChange={setTechnologies} /></Field>
        <Field label="Application link" className="full"><input className="input" required type="url" value={form.apply_url} onChange={set('apply_url')} placeholder="https://company.com/careers/…" /></Field>
        <button className="btn primary full" disabled={busy}>{job ? 'Save job' : 'Publish job'}</button>
      </form>
    </Modal>
  )
}
