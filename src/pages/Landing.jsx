import { Link } from 'react-router-dom'
import { Code2, HelpCircle, FolderGit2, MessageSquare, Users, Briefcase } from 'lucide-react'
import { CodeBlock } from '../components/ui'

const FEATURES = [
  [Code2, 'Share code', 'Post snippets, images and project links. Get likes and threaded comments.'],
  [HelpCircle, 'Ask & answer', 'A Q&A space with votes, tags and accepted answers.'],
  [FolderGit2, 'Build together', 'Publish projects, list the roles you need, and accept join requests.'],
  [MessageSquare, 'Real-time chat', 'Private messages and automatic team chats for every project.'],
  [Users, 'Groups', 'Join communities around languages, levels and locations.'],
  [Briefcase, 'Jobs', 'Find developer roles and save the ones you like.'],
]

const SNIPPET = `const dev = await devconnect.join({
  username: 'you',
  stack: ['React', 'Node.js', 'PostgreSQL'],
})
dev.follow('@friends').build('something great')`

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand" style={{ padding: 0 }}><span className="brand-mark">&lt;/&gt;</span> DevConnect</div>
        <div className="row">
          <Link to="/login" className="btn ghost">Log in</Link>
          <Link to="/register" className="btn primary">Join now</Link>
        </div>
      </nav>
      <section className="landing-hero">
        <div>
          <span className="chip orange">The social network for developers</span>
          <h1 style={{ marginTop: 16 }}>Code, ask, build — <span className="grad-text">together.</span></h1>
          <p className="muted" style={{ fontSize: '1.1rem', maxWidth: 520 }}>
            DevConnect is where developers share what they're building, help each other with real problems, and find teammates for their next project.
          </p>
          <div className="row" style={{ marginTop: 24 }}>
            <Link to="/register" className="btn primary">Create your profile</Link>
            <Link to="/login" className="btn">I have an account</Link>
          </div>
        </div>
        <div className="hero-banner">
          <CodeBlock code={SNIPPET} language="javascript" />
          <div className="row wrap" style={{ marginTop: 12 }}>
            {['#react', '#node', '#python', '#rust', '#opensource'].map((t) => <span key={t} className="chip violet">{t}</span>)}
          </div>
        </div>
      </section>
      <section className="feature-grid">
        {FEATURES.map(([Icon, title, text]) => (
          <div key={title} className="card">
            <Icon size={26} />
            <h3 style={{ marginTop: 12 }}>{title}</h3>
            <p className="muted small" style={{ margin: 0 }}>{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
