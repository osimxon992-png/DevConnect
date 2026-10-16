import { useState } from 'react'
import { supabase, q } from '../lib/supabase'
import { LANGUAGES, LEVELS } from '../lib/constants'
import { like } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Loader, Select } from '../components/ui'
import DeveloperCard from '../components/DeveloperCard'

export const DEV_SELECT = 'id, username, full_name, avatar_url, bio, location, level, main_language, user_skills(skills(name))'

export default function Developers() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ text: '', skill: '', language: '', level: '' })
  const [applied, setApplied] = useState(filters)
  const set = (k) => (e) => {
    const next = { ...filters, [k]: e.target.value }
    setFilters(next)
    if (k !== 'text') setApplied(next) // selects apply immediately, text on submit
  }

  const { data: skills } = useQuery(() => q(supabase.from('skills').select('id, name').order('name')), [])
  const { data, loading, error } = useQuery(async () => {
    let query = supabase.from('profiles').select(DEV_SELECT).neq('id', user.id).order('created_at', { ascending: false }).limit(60)
    if (applied.text) query = query.or(`username.ilike.${like(applied.text)},full_name.ilike.${like(applied.text)}`)
    if (applied.level) query = query.eq('level', applied.level)
    // main_language is always kept inside languages (sign-up trigger and profile editor)
    if (applied.language) query = query.contains('languages', [applied.language])
    if (applied.skill) {
      const ids = await q(supabase.from('user_skills').select('user_id').eq('skill_id', applied.skill))
      query = query.in('id', ids.map((r) => r.user_id))
    }
    const [devs, follows] = await Promise.all([
      q(query),
      q(supabase.from('follows').select('following_id').eq('follower_id', user.id)),
    ])
    const set = new Set(follows.map((f) => f.following_id))
    return devs.map((d) => ({ ...d, following: set.has(d.id) }))
  }, [applied, user.id])

  return (
    <>
      <div className="page-head">
        <div><h1>Discover developers</h1><p>Find people by name, skill, language or level.</p></div>
      </div>
      <form className="card form-grid" onSubmit={(e) => { e.preventDefault(); setApplied(filters) }}>
        <input className="input full" placeholder="Search by username or name" value={filters.text} onChange={set('text')} aria-label="Search developers" />
        <Select options={[['', 'Any skill'], ...(skills || []).map((s) => [String(s.id), s.name])]} value={filters.skill} onChange={set('skill')} aria-label="Skill" />
        <Select options={[['', 'Any language'], ...LANGUAGES]} value={filters.language} onChange={set('language')} aria-label="Language" />
        <Select options={[['', 'Any level'], ...LEVELS]} value={filters.level} onChange={set('level')} aria-label="Level" />
        <button className="btn primary">Search</button>
      </form>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No developers match">
        <div className="grid">{data?.map((d) => <DeveloperCard key={d.id} dev={d} following={d.following} />)}</div>
      </Loader>
    </>
  )
}
