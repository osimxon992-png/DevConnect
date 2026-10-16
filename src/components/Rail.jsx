import { Link } from 'react-router-dom'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar } from './ui'
import { FollowButton } from './actions'

// Right column: profile summary, suggested developers, trending tags, open projects.
export default function Rail() {
  const { user, profile } = useAuth()
  const { data } = useQuery(async () => {
    const following = await q(supabase.from('follows').select('following_id').eq('follower_id', user.id))
    const exclude = [user.id, ...following.map((f) => f.following_id)]
    const [suggested, tags, projects, followers, myProjects] = await Promise.all([
      q(supabase.from('profiles').select(PROFILE_FIELDS).not('id', 'in', `(${exclude.join(',')})`).order('created_at', { ascending: false }).limit(4)),
      q(supabase.from('question_tags').select('tag').limit(300)),
      q(supabase.from('projects').select('id, name, technologies').eq('status', 'looking').order('created_at', { ascending: false }).limit(3)),
      q(supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id)),
      q(supabase.from('project_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id)),
    ])
    const counts = {}
    tags.forEach(({ tag }) => { counts[tag] = (counts[tag] || 0) + 1 })
    const trending = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t)
    return { suggested, trending, projects, stats: { followers, following: following.length, projects: myProjects } }
  }, [user.id])

  return (
    <aside className="rail">
      <div className="card" style={{ textAlign: 'center' }}>
        <Link to={`/developers/${profile.username}`} style={{ display: 'inline-block' }}><Avatar profile={profile} size={76} ring /></Link>
        <h3 style={{ marginTop: 12, marginBottom: 0 }}>{profile.full_name || profile.username}</h3>
        <div className="muted small">@{profile.username}</div>
        {data && (
          <div className="row" style={{ justifyContent: 'space-around', marginTop: 14 }}>
            <div className="stat"><b>{data.stats.followers}</b><span>Followers</span></div>
            <div className="stat"><b>{data.stats.following}</b><span>Following</span></div>
            <div className="stat"><b>{data.stats.projects}</b><span>Projects</span></div>
          </div>
        )}
      </div>

      {data?.suggested.length > 0 && (
        <div className="card">
          <div className="section-head"><h3>Developers to follow</h3><Link to="/developers">See all</Link></div>
          <div className="rail-list">
            {data.suggested.map((p) => (
              <div key={p.id} className="rail-item">
                <Link to={`/developers/${p.username}`}><Avatar profile={p} size={36} /></Link>
                <Link to={`/developers/${p.username}`} style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontWeight: 600, fontSize: '.88rem' }}>{p.full_name || p.username}</div>
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
          <div className="row wrap">
            {data.trending.map((t) => <Link key={t} to={`/questions?tag=${encodeURIComponent(t)}`} className="chip">#{t}</Link>)}
          </div>
        </div>
      )}

      {data?.projects.length > 0 && (
        <div className="card">
          <div className="section-head"><h3>Looking for developers</h3><Link to="/projects">See all</Link></div>
          <div className="rail-list">
            {data.projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="rail-item" style={{ display: 'block' }}>
                <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{p.name}</div>
                <div className="faint small ellipsis">{p.technologies.join(' · ') || 'Open project'}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
