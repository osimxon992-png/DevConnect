// TEMPORARY visual harness with sample props; deleted after the design check.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import PostCard from './components/PostCard'
import PostComposer from './components/PostComposer'
import ProjectCard from './components/ProjectCard'
import QuestionCard from './components/QuestionCard'
import JobCard from './components/JobCard'
import GroupCard from './components/GroupCard'
import DeveloperCard from './components/DeveloperCard'
import './styles.css'

const me = { id: 'u1', username: 'rahim', full_name: 'Rahim Karimov', level: 'middle', main_language: 'Go', is_admin: true, languages: [] }
const mira = { id: 'u2', username: 'mira', full_name: 'Mira Sato', level: 'senior', main_language: 'TypeScript' }
const now = Date.now()
const posts = [
  { id: 'p1', author_id: 'u2', author: mira, content: 'Finally replaced our hand-rolled retry loop with a tiny helper. Exponential backoff, jitter, and it respects AbortSignal.', code: "export async function retry(fn, { tries = 5, signal } = {}) {\n  for (let i = 0; i < tries; i++) {\n    try { return await fn() } catch (e) {\n      if (signal?.aborted || i === tries - 1) throw e\n      await sleep(2 ** i * 100 + Math.random() * 100)\n    }\n  }\n}", language: 'TypeScript', image_urls: [], likes_count: 48, comments_count: 24, liked: true, created_at: new Date(now - 7.2e6).toISOString() },
  { id: 'p2', author_id: 'u3', author: { id: 'u3', username: 'diego', full_name: 'Diego Alvarez', level: 'junior' }, content: 'Is anyone running Postgres row-level security with realtime in production? Curious how you test the policies.', code: '', language: '', image_urls: [], project_link: 'github.com/diego/rls-tests', likes_count: 12, comments_count: 9, liked: false, created_at: new Date(now - 1.8e7).toISOString() },
]
const project = { id: 'pr1', name: 'Trail Log', description: 'Offline-first hiking journal with map sync. React Native front, Supabase back.', status: 'looking', team_size: 5, technologies: ['React Native', 'Supabase', 'Mapbox'], required_roles: ['Frontend Developer', 'Backend Developer', 'Mobile Developer', 'UI/UX Developer', 'DevOps'], owner: mira, project_members: [{ role: 'Owner', user_id: 'u2' }, { role: 'Backend Developer', user_id: 'u4' }, { role: 'DevOps', user_id: 'u5' }] }
const question = { id: 'q1', title: 'Why does useEffect run twice in development?', description: 'My fetch fires two times on mount and I only see it locally. Production is fine.', status: 'open', score: 7, answers_count: 3, language: 'JavaScript', question_tags: [{ tag: 'react' }, { tag: 'hooks' }], author: mira, created_at: new Date(now - 3.6e6).toISOString() }
const job = { id: 'j1', title: 'Backend Engineer (Go)', company: 'Northwind Labs', work_mode: 'remote', employment_type: 'full_time', location: 'Europe', salary: '€70k–90k', technologies: ['Go', 'PostgreSQL', 'Kafka'], created_at: new Date(now - 8.64e7).toISOString() }
const group = { id: 'g1', name: 'Backend Developers', description: 'APIs, databases, queues and scaling.', group_members: [{ count: 214 }] }

function Board() {
  return (
    <>
      <PostComposer onSaved={() => {}} />
      <div className="tabs"><button className="tab active">For you</button><button className="tab">Following</button><button className="tab">Trending</button><button className="tab">Latest</button></div>
      <div className="stack">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
      <div className="grid"><ProjectCard project={project} /><GroupCard group={group} joined={false} onToggle={() => {}} /></div>
      <QuestionCard question={{ ...question }} />
      <QuestionCard question={{ ...question, id: 'q2', status: 'solved', title: 'Rust lifetimes in a struct holding a slice', score: 21, answers_count: 5, language: 'Rust', question_tags: [{ tag: 'rust' }] }} />
      <div className="grid wide"><JobCard job={job} /><DeveloperCard dev={{ ...mira, bio: 'Building developer tools. Ex-infra.', location: 'Osaka', user_skills: [{ skills: { name: 'TypeScript' } }, { skills: { name: 'Go' } }] }} following={false} /></div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthContext.Provider value={{ session: {}, user: { id: me.id }, profile: me, loading: false, signOut() {}, refreshProfile() {} }}>
    <ToastProvider>
      <MemoryRouter initialEntries={['/home']}>
        <Routes><Route element={<Layout />}><Route path="/home" element={<Board />} /></Route></Routes>
      </MemoryRouter>
    </ToastProvider>
  </AuthContext.Provider>,
)
