import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from './ui'

export function VoteButtons({ table, column, id, score, myVote = 0, disabled }) {
  const { user } = useAuth()
  const toast = useToast()
  const [state, setState] = useState({ score, vote: myVote })
  const vote = async (value) => {
    const next = state.vote === value ? 0 : value
    const { error } = next === 0
      ? await supabase.from(table).delete().eq(column, id).eq('user_id', user.id)
      : await supabase.from(table).upsert({ [column]: id, user_id: user.id, value: next })
    if (error) return toast(error.message, 'error')
    setState({ score: state.score - state.vote + next, vote: next })
  }
  return (
    <div className="vote">
      <button className={`icon-btn up ${state.vote === 1 ? 'on' : ''}`} onClick={() => vote(1)} disabled={disabled} aria-label="Upvote" aria-pressed={state.vote === 1}><ArrowBigUp size={24} /></button>
      <b>{state.score}</b>
      <button className={`icon-btn down ${state.vote === -1 ? 'on' : ''}`} onClick={() => vote(-1)} disabled={disabled} aria-label="Downvote" aria-pressed={state.vote === -1}><ArrowBigDown size={24} /></button>
    </div>
  )
}

export default function QuestionCard({ question: qn }) {
  const solved = qn.status === 'solved'
  return (
    <article className="card hover q-card">
      <div className="q-cell">
        <div><b>{qn.score}</b><br /><span>votes</span></div>
        <div><b>{qn.answers_count}</b><br /><span>answers</span></div>
      </div>
      <div className="q-main">
        <div className="small" style={{ fontWeight: 700 }}><span className={`mark ${solved ? 'filled' : ''}`} />{solved ? 'Solved' : 'Open'}</div>
        <Link to={`/questions/${qn.id}`}><h3>{qn.title}</h3></Link>
        <p className="muted small" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{qn.description}</p>
        <div className="row wrap between">
          <div className="row wrap" style={{ gap: 6 }}>
            {qn.language && <span className="chip blue">{qn.language}</span>}
            {qn.question_tags?.map((t) => <Link key={t.tag} to={`/questions?tag=${encodeURIComponent(t.tag)}`} className="chip tag">#{t.tag}</Link>)}
          </div>
          {qn.author && (
            <Link to={`/developers/${qn.author.username}`} className="row small muted" style={{ gap: 6 }}>
              <Avatar profile={qn.author} size={20} /> @{qn.author.username} · {timeAgo(qn.created_at)}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
