import { Link } from 'react-router-dom'

// The board shows what each kind of flyer is for; it describes features, it does not fake activity.
export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-top">
        <section className="landing-left">
          <div className="brand"><span>Dev</span><span>Connect</span></div>
          <p className="pitch">A noticeboard for developers. Post what you're building, ask what you're stuck on, and pin up a project when you need a team.</p>
          <div className="actions">
            <Link to="/register" className="btn primary">Create your profile</Link>
            <Link to="/login" className="btn">Log in</Link>
          </div>
        </section>

        <section className="landing-board" aria-label="What you can do">
          <div className="flyer pink">
            <div className="flyer-body">
              <h2 className="flyer-title">Your project needs a team</h2>
              <p>Pin a project, list the roles you're missing. Developers tear off a role to ask to join; you accept, and they land in the team chat.</p>
            </div>
            <div className="tear-tabs" aria-hidden>
              {['Frontend', 'Backend', 'Mobile', 'UI/UX', 'DevOps', 'Game dev'].map((r, i) => (
                <span key={r} className={`tear-tab ${i === 1 || i === 4 ? 'taken' : ''}`}>{r}</span>
              ))}
            </div>
          </div>
          <div className="flyer blue">
            <div className="flyer-body">
              <h2 className="flyer-title">Stuck? Ask.</h2>
              <p>Questions with code, tags, votes and an accepted answer.</p>
              <div className="small"><span className="mark" />Open <span className="mark filled" style={{ marginLeft: 12 }} />Solved</div>
            </div>
          </div>
          <div className="flyer orange">
            <div className="flyer-body">
              <h2 className="flyer-title">Groups</h2>
              <p>Rooms for a language, a level or a city. Post, comment, run it as an admin.</p>
            </div>
          </div>
          <div className="card">
            <h3>Share code, not screenshots</h3>
            <p className="muted" style={{ margin: 0 }}>Posts carry text, images, a code snippet with its language, and a project link. Likes, threaded comments, saves.</p>
          </div>
          <div className="flyer green">
            <div className="flyer-body">
              <h2 className="flyer-title">Jobs</h2>
              <p>Listings with stack, salary and remote or on-site. Save them, apply on the company's site.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
