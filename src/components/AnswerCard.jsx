import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, MessageCircle, Trash2 } from 'lucide-react'
import { timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { Avatar, CodeBlock, Menu } from './ui'
import { VoteButtons } from './QuestionCard'
import CommentSection from './CommentSection'

export default function AnswerCard({ answer, accepted, canAccept, onAccept, onDelete }) {
  const { user, profile } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const mine = answer.author_id === user.id
  return (
    <div className={`card row ${accepted ? 'accepted' : ''}`} style={{ alignItems: 'flex-start', gap: 14 }}>
      <VoteButtons table="answer_votes" column="answer_id" id={answer.id} score={answer.score} myVote={answer.myVote} disabled={mine} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row between">
          <Link to={`/developers/${answer.author?.username}`} className="row small" style={{ gap: 8 }}>
            <Avatar profile={answer.author} size={28} />
            <b>{answer.author?.full_name || answer.author?.username}</b>
            <span className="faint">· {timeAgo(answer.created_at)}</span>
          </Link>
          <div className="row" style={{ gap: 4 }}>
            {accepted && <span className="chip green"><CheckCircle2 size={13} /> Accepted</span>}
            {(mine || profile.is_admin) && (
              <Menu><button className="danger" onClick={() => onDelete(answer)}><Trash2 size={15} /> Delete</button></Menu>
            )}
          </div>
        </div>
        <div className="prewrap" style={{ marginTop: 10 }}>{answer.content}</div>
        <CodeBlock code={answer.code} />
        <div className="row" style={{ marginTop: 6 }}>
          <button className="icon-btn small" onClick={() => setShowComments(!showComments)}><MessageCircle size={15} /> Comments</button>
          {canAccept && (
            <button className="btn sm" onClick={() => onAccept(accepted ? null : answer.id)}>
              <CheckCircle2 size={15} /> {accepted ? 'Unaccept' : 'Accept answer'}
            </button>
          )}
        </div>
        {showComments && <div style={{ marginTop: 10 }}><CommentSection target={{ answer_id: answer.id }} /></div>}
      </div>
    </div>
  )
}
