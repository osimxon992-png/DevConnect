import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { PROFILE_FIELDS } from '../lib/constants'
import { timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Avatar, CodeBlock, Empty, Field, Menu, Spinner } from '../components/ui'
import { ReportItem, SaveButton } from '../components/actions'
import { VoteButtons } from '../components/QuestionCard'
import AnswerCard from '../components/AnswerCard'
import CommentSection from '../components/CommentSection'
import { QUESTION_SELECT, QuestionForm } from './Questions'

export default function QuestionPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const { data, setData, loading, error, reload } = useQuery(async () => {
    const question = await q(supabase.from('questions').select(QUESTION_SELECT).eq('id', id).maybeSingle())
    if (!question) return null
    const answers = await q(supabase.from('answers').select(`*, author:profiles!author_id(${PROFILE_FIELDS})`).eq('question_id', id).order('score', { ascending: false }).order('created_at'))
    const [qVote, aVotes] = await Promise.all([
      q(supabase.from('question_votes').select('value').eq('question_id', id).eq('user_id', user.id)),
      answers.length ? q(supabase.from('answer_votes').select('answer_id, value').eq('user_id', user.id).in('answer_id', answers.map((a) => a.id))) : [],
    ])
    const votes = Object.fromEntries(aVotes.map((v) => [v.answer_id, v.value]))
    return { question: { ...question, myVote: qVote[0]?.value || 0 }, answers: answers.map((a) => ({ ...a, myVote: votes[a.id] || 0 })) }
  }, [id, user.id])

  if (loading) return <Spinner />
  if (error || !data) return <Empty title="Question not found">{error?.message}</Empty>
  const { question: qn, answers } = data
  const mine = qn.author_id === user.id

  const accept = async (answerId) => {
    const { error } = await supabase.from('questions').update({ accepted_answer_id: answerId, status: answerId ? 'solved' : 'open' }).eq('id', qn.id)
    if (error) return toast(error.message, 'error')
    setData({ ...data, question: { ...qn, accepted_answer_id: answerId, status: answerId ? 'solved' : 'open' } })
  }
  const setStatus = async (status) => {
    const { error } = await supabase.from('questions').update({ status }).eq('id', qn.id)
    if (error) return toast(error.message, 'error')
    setData({ ...data, question: { ...qn, status } })
  }
  const removeQuestion = async () => {
    if (!confirm('Delete this question and all its answers?')) return
    const { error } = await supabase.from('questions').delete().eq('id', qn.id)
    if (error) return toast(error.message, 'error')
    navigate('/questions')
  }
  const removeAnswer = async (a) => {
    if (!confirm('Delete this answer?')) return
    const { error } = await supabase.from('answers').delete().eq('id', a.id)
    if (error) return toast(error.message, 'error')
    setData({ ...data, answers: answers.filter((x) => x.id !== a.id) })
  }

  return (
    <>
      <div className="card row" style={{ alignItems: 'flex-start', gap: 14 }}>
        <VoteButtons table="question_votes" column="question_id" id={qn.id} score={qn.score} myVote={qn.myVote} disabled={mine} />
        <div style={{ flex: 1, minWidth: 0 }} className="stack">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <h1 style={{ margin: 0 }}>{qn.title}</h1>
            <div className="row" style={{ gap: 2 }}>
              <SaveButton type="question" id={qn.id} />
              <Menu>
                {mine && <button onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>}
                {mine && <button onClick={() => setStatus(qn.status === 'open' ? 'solved' : 'open')}>Mark as {qn.status === 'open' ? 'solved' : 'open'}</button>}
                {(mine || profile.is_admin) && <button className="danger" onClick={removeQuestion}><Trash2 size={15} /> Delete</button>}
                {!mine && <ReportItem type="question" id={qn.id} />}
              </Menu>
            </div>
          </div>
          <div className="row wrap small muted" style={{ gap: 8 }}>
            <span className={`chip ${qn.status === 'solved' ? 'green' : 'blue'}`}>{qn.status === 'solved' ? 'Solved' : 'Open'}</span>
            <Link to={`/developers/${qn.author?.username}`} className="row" style={{ gap: 6 }}><Avatar profile={qn.author} size={20} /> @{qn.author?.username}</Link>
            <span>asked {timeAgo(qn.created_at)}</span>
            {qn.updated_at && <span>· edited</span>}
          </div>
          <div className="prewrap">{qn.description}</div>
          <CodeBlock code={qn.code} language={qn.language} />
          <div className="row wrap" style={{ gap: 6 }}>
            {qn.language && <span className="chip orange">{qn.language}</span>}
            {qn.question_tags.map((t) => <Link key={t.tag} to={`/questions?tag=${encodeURIComponent(t.tag)}`} className="chip tag">#{t.tag}</Link>)}
          </div>
          <details>
            <summary className="muted small" style={{ cursor: 'pointer' }}>Comments</summary>
            <div style={{ marginTop: 10 }}><CommentSection target={{ question_id: qn.id }} /></div>
          </details>
        </div>
      </div>

      <h2 style={{ margin: 0 }}>{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</h2>
      {[...answers].sort((a, b) => (b.id === qn.accepted_answer_id) - (a.id === qn.accepted_answer_id)).map((a) => (
        <AnswerCard key={a.id} answer={a} accepted={a.id === qn.accepted_answer_id} canAccept={mine} onAccept={accept} onDelete={removeAnswer} />
      ))}
      <AnswerForm questionId={qn.id} onAdded={reload} />
      {editing && <QuestionForm question={qn} onClose={() => setEditing(false)} onSaved={reload} />}
    </>
  )
}

function AnswerForm({ questionId, onAdded }) {
  const { user } = useAuth()
  const toast = useToast()
  const [content, setContent] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setBusy(true)
    const { error } = await supabase.from('answers').insert({ question_id: questionId, author_id: user.id, content: content.trim(), code })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setContent(''); setCode('')
    onAdded()
  }
  return (
    <form className="card stack" onSubmit={submit}>
      <h3 style={{ margin: 0 }}>Your answer</h3>
      <Field label="Explanation"><textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} required /></Field>
      <Field label="Code (optional)"><textarea className="textarea code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} /></Field>
      <button className="btn primary" disabled={busy || !content.trim()}>Post answer</button>
    </form>
  )
}
