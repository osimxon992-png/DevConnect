import { useState } from 'react'
import { supabase, q } from '../lib/supabase'
import { POST_SELECT, withMyLikes } from '../lib/posts'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Loader } from '../components/ui'
import PostCard from '../components/PostCard'
import QuestionCard from '../components/QuestionCard'
import ProjectCard from '../components/ProjectCard'
import JobCard from '../components/JobCard'
import { QUESTION_SELECT } from './Questions'
import { PROJECT_CARD_SELECT } from './Profile'

const TYPES = {
  posts: ['saved_posts', 'post', 'posts', POST_SELECT],
  questions: ['saved_questions', 'question', 'questions', QUESTION_SELECT],
  projects: ['saved_projects', 'project', 'projects', PROJECT_CARD_SELECT],
  jobs: ['saved_jobs', 'job', 'jobs', '*'],
}

export default function Saved() {
  const { user } = useAuth()
  const [tab, setTab] = useState('posts')
  const { data, setData, loading, error } = useQuery(async () => {
    const [table, alias, target, select] = TYPES[tab]
    const rows = await q(supabase.from(table).select(`${alias}:${target}(${select})`).eq('user_id', user.id).order('created_at', { ascending: false }))
    const items = rows.map((r) => r[alias]).filter(Boolean) // hidden by RLS (e.g. now-private author) => null
    return tab === 'posts' ? withMyLikes(items, user.id) : items
  }, [tab, user.id])

  return (
    <>
      <div className="page-head"><div><h1>Saved</h1><p>Everything you bookmarked, in one place.</p></div></div>
      <div className="tabs" role="tablist">
        {Object.keys(TYPES).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle={`No saved ${tab}`} emptyText="Use the bookmark icon to save things for later.">
        {tab === 'posts' && <div className="stack">{data?.map((p) => <PostCard key={p.id} post={p} onDeleted={(id) => setData((d) => d.filter((x) => x.id !== id))} />)}</div>}
        {tab === 'questions' && <div className="stack">{data?.map((x) => <QuestionCard key={x.id} question={x} />)}</div>}
        {tab === 'projects' && <div className="grid">{data?.map((x) => <ProjectCard key={x.id} project={x} />)}</div>}
        {tab === 'jobs' && <div className="grid wide">{data?.map((x) => <JobCard key={x.id} job={x} />)}</div>}
      </Loader>
    </>
  )
}
