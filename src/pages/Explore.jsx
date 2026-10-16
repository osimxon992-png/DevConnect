import { Link, useSearchParams } from 'react-router-dom'
import { supabase, q } from '../lib/supabase'
import { POST_SELECT, withMyLikes } from '../lib/posts'
import { like } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Empty, Loader } from '../components/ui'
import PostCard from '../components/PostCard'
import QuestionCard from '../components/QuestionCard'
import ProjectCard from '../components/ProjectCard'
import GroupCard from '../components/GroupCard'
import JobCard from '../components/JobCard'
import DeveloperCard from '../components/DeveloperCard'
import { DEV_SELECT } from './Developers'
import { QUESTION_SELECT } from './Questions'
import { PROJECT_CARD_SELECT } from './Profile'
import { GROUP_SELECT } from './Groups'

const N = 6

// Global search with categorized results. Without a query it shows what's popular.
export default function Explore() {
  const [params] = useSearchParams()
  const term = params.get('q')?.trim() || ''
  const { user } = useAuth()

  const { data, loading, error } = useQuery(async () => {
    const t = like(term)
    const [developers, posts, questions, projects, groups, jobs] = await Promise.all([
      term ? q(supabase.from('profiles').select(DEV_SELECT).or(`username.ilike.${t},full_name.ilike.${t},bio.ilike.${t}`).limit(N)) : [],
      q((term ? supabase.from('posts').select(POST_SELECT).or(`content.ilike.${t},code.ilike.${t}`) : supabase.from('posts').select(POST_SELECT).is('group_id', null).order('likes_count', { ascending: false }))
        .order('created_at', { ascending: false }).limit(N)),
      q((term ? supabase.from('questions').select(QUESTION_SELECT).or(`title.ilike.${t},description.ilike.${t}`) : supabase.from('questions').select(QUESTION_SELECT).order('score', { ascending: false }))
        .order('created_at', { ascending: false }).limit(N)),
      q((term ? supabase.from('projects').select(PROJECT_CARD_SELECT).or(`name.ilike.${t},description.ilike.${t}`) : supabase.from('projects').select(PROJECT_CARD_SELECT).eq('status', 'looking'))
        .order('created_at', { ascending: false }).limit(N)),
      q((term ? supabase.from('groups').select(GROUP_SELECT).or(`name.ilike.${t},description.ilike.${t}`) : supabase.from('groups').select(GROUP_SELECT)).limit(N)),
      q((term ? supabase.from('jobs').select('*').or(`title.ilike.${t},company.ilike.${t},description.ilike.${t}`) : supabase.from('jobs').select('*'))
        .order('created_at', { ascending: false }).limit(N)),
    ])
    return { developers, posts: await withMyLikes(posts, user.id), questions, projects, groups, jobs }
  }, [term, user.id])

  const total = data ? Object.values(data).reduce((n, list) => n + list.length, 0) : 0
  const section = (title, items, more, render, grid = 'grid') => items?.length > 0 && (
    <section className="stack">
      <div className="section-head"><h2>{title}</h2>{more && <Link to={more}>See all</Link>}</div>
      <div className={grid}>{items.map(render)}</div>
    </section>
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{term ? <>Results for “{term}”</> : 'Explore'}</h1>
          <p>{term ? 'Developers, posts, questions, projects, groups and jobs.' : 'Popular across DevConnect right now.'}</p>
        </div>
      </div>
      <Loader loading={loading} error={error}>
        {term && total === 0 && <Empty title="Nothing found">Try a different keyword.</Empty>}
        {section('Developers', data?.developers, '/developers', (d) => <DeveloperCard key={d.id} dev={d} />)}
        {section(term ? 'Posts' : 'Popular posts', data?.posts, null, (p) => <PostCard key={p.id} post={p} />, 'stack')}
        {section(term ? 'Questions' : 'Top questions', data?.questions, `/questions${term ? `?q=${encodeURIComponent(term)}` : ''}`, (x) => <QuestionCard key={x.id} question={x} />, 'stack')}
        {section(term ? 'Projects' : 'Open projects', data?.projects, '/projects', (x) => <ProjectCard key={x.id} project={x} />)}
        {section('Groups', data?.groups, '/groups', (g) => <GroupCard key={g.id} group={g} />)}
        {section(term ? 'Jobs' : 'Latest jobs', data?.jobs, '/jobs', (j) => <JobCard key={j.id} job={j} />, 'grid wide')}
      </Loader>
    </>
  )
}
