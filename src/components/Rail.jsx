import { Link } from 'react-router-dom'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar } from './ui'
import { FollowButton } from './actions'
import ProjectCard from './ProjectCard'
import QuestionCard from './QuestionCard'

const PROJECT_SELECT = `*, owner:profiles!owner_id(${PROFILE_FIELDS}), project_members(role, user_id)`
const QUESTION_SELECT = `*, author:profiles!author_id(${PROFILE_FIELDS}), question_tags(tag)`

// Right column, the board itself: the newest recruiting project, open questions, people, tags.
export default function Rail() {
  const { user } = useAuth()
  const { data } = useQuery(async () => {
    const following = await q(supabase.from('follows').select('following_id').eq('follower_id', user.id))
    const exclude = [user.id, ...following.map((f) => f.following_id)]
    const [projects, questions, suggested, tags] = await Promise.all([
      q(supabase.from('projects').select(PROJECT_SELECT).eq('status', 'looking').order('created_at', { ascending: false }).limit(1)),
      q(supabase.from('questions').select(QUESTION_SELECT).eq('status', 'open').order('created_at', { ascending: false }).limit(2)),
      q(supabase.from('profiles').select(PROFILE_FIELDS).not('id', 'in', `(${exclude.join(',')})`).order('created_at', { ascending: false }).limit(4)),
      q(supabase.from('question_tags').select('tag').limit(300)),
    ])
    const counts = {}
    tags.forEach(({ tag }) => { counts[tag] = (counts[tag] || 0) + 1 })
    const trending = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t)
    return { project: projects[0], questions, suggested, trending }
  }, [user.id])

  return (
    <aside className="rail">
      {data?.project ? <ProjectCard project={data.project} /> : (
        <div className="flyer pink">
          <div className="flyer-body">
            <h3 className="flyer-title" style={{ fontSize: '1.6rem' }}>No one is recruiting yet</h3>
            <p>Pin the first project and list the roles you need.</p>
            <Link to="/create-project" className="btn sm primary" style={{ alignSelf: 'flex-start' }}>Pin a project</Link>
          </div>
        </div>
      )}

      {data?.questions.map((qn) => <QuestionCard key={qn.id} question={qn} />)}

      {data?.suggested.length > 0 && (
        <div className="card">
          <div className="section-head"><h3>Developers to follow</h3><Link to="/developers">See all</Link></div>
          <div className="rail-list">
            {data.suggested.map((p) => (
              <div key={p.id} className="rail-item">
                <Link to={`/developers/${p.username}`}><Avatar profile={p} size={36} /></Link>
                <Link to={`/developers/${p.username}`} style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontWeight: 700, fontSize: '.9rem' }}>{p.full_name || p.username}</div>
                  <div className="faint small ellipsis">{p.main_language || p.level}</div>
                </Link>
                <FollowButton userId={p.id} initial={false} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.trending.length > 0 && (
        <div className="card">
          <h3>Trending tags</h3>
          <div className="row wrap" style={{ gap: 6 }}>
            {data.trending.map((t) => <Link key={t} to={`/questions?tag=${encodeURIComponent(t)}`} className="chip tag">#{t}</Link>)}
          </div>
        </div>
      )}
    </aside>
  )
}
