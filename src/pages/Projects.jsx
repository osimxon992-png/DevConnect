import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROJECT_STATUSES, ROLES } from '../lib/constants'
import { like } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Loader, Select } from '../components/ui'
import ProjectCard from '../components/ProjectCard'
import { PROJECT_CARD_SELECT } from './Profile'

export default function Projects() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ text: '', status: '', role: '', tech: '', mine: false })
  const [applied, setApplied] = useState(filters)
  const set = (k, v) => { const next = { ...filters, [k]: v }; setFilters(next); if (k !== 'text' && k !== 'tech') setApplied(next) }

  const { data, loading, error } = useQuery(async () => {
    let query = supabase.from('projects').select(PROJECT_CARD_SELECT).order('created_at', { ascending: false }).limit(60)
    if (applied.text) query = query.or(`name.ilike.${like(applied.text)},description.ilike.${like(applied.text)}`)
    if (applied.status) query = query.eq('status', applied.status)
    if (applied.role) query = query.contains('required_roles', [applied.role])
    if (applied.tech) query = query.contains('technologies', [applied.tech.trim()])
    if (applied.mine) {
      const rows = await q(supabase.from('project_members').select('project_id').eq('user_id', user.id))
      query = query.in('id', rows.map((r) => r.project_id))
    }
    return q(query)
  }, [applied, user.id])

  return (
    <>
      <div className="page-head">
        <div><h1>Projects</h1><p>Find a team, or build one.</p></div>
        <Link to="/create-project" className="btn primary"><Plus size={16} /> New project</Link>
      </div>
      <form className="card form-grid" onSubmit={(e) => { e.preventDefault(); setApplied(filters) }}>
        <input className="input" placeholder="Search projects" value={filters.text} onChange={(e) => set('text', e.target.value)} aria-label="Search projects" />
        <input className="input" placeholder="Technology (exact, e.g. React)" value={filters.tech} onChange={(e) => set('tech', e.target.value)} aria-label="Technology" />
        <Select options={[['', 'Any status'], ...PROJECT_STATUSES.map(([v, l]) => [v, l])]} value={filters.status} onChange={(e) => set('status', e.target.value)} aria-label="Status" />
        <Select options={[['', 'Any role needed'], ...ROLES]} value={filters.role} onChange={(e) => set('role', e.target.value)} aria-label="Role" />
        <label className="check"><input type="checkbox" checked={filters.mine} onChange={(e) => set('mine', e.target.checked)} /> Only my projects</label>
        <button className="btn">Apply</button>
      </form>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No projects found" emptyText="Start one and invite developers to join.">
        <div className="grid">{data?.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
      </Loader>
    </>
  )
}
