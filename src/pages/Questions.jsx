import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase, q } from '../lib/supabase'
import { LANGUAGES, PROFILE_FIELDS } from '../lib/constants'
import { like } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuery } from '../hooks/useQuery'
import { Field, Loader, Modal, Select, TagInput } from '../components/ui'
import QuestionCard from '../components/QuestionCard'

export const QUESTION_SELECT = `*, author:profiles!author_id(${PROFILE_FIELDS}), question_tags(tag)`

export default function Questions() {
  const [params, setParams] = useSearchParams()
  const [asking, setAsking] = useState(false)
  const [text, setText] = useState(params.get('q') || '')
  const filter = { status: params.get('status') || '', tag: params.get('tag') || '', language: params.get('language') || '', sort: params.get('sort') || 'new', q: params.get('q') || '' }
  const update = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p) }

  const { data, loading, error } = useQuery(async () => {
    let query = supabase.from('questions').select(filter.tag ? QUESTION_SELECT.replace('question_tags(tag)', 'question_tags!inner(tag)') : QUESTION_SELECT).limit(50)
    if (filter.status) query = query.eq('status', filter.status)
    if (filter.language) query = query.eq('language', filter.language)
    if (filter.tag) query = query.eq('question_tags.tag', filter.tag)
    if (filter.q) query = query.or(`title.ilike.${like(filter.q)},description.ilike.${like(filter.q)}`)
    if (filter.sort === 'top') query = query.order('score', { ascending: false })
    if (filter.sort === 'unanswered') query = query.eq('answers_count', 0)
    return q(query.order('created_at', { ascending: false }))
  }, [params.toString()])

  return (
    <>
      <div className="page-head">
        <div><h1>Questions</h1><p>Ask the community, help others, earn upvotes.</p></div>
        <button className="btn primary" onClick={() => setAsking(true)}><Plus size={16} /> Ask question</button>
      </div>
      <div className="card form-grid">
        <form className="full" onSubmit={(e) => { e.preventDefault(); update('q', text.trim()) }}>
          <input className="input" placeholder="Search questions" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search questions" />
        </form>
        <Select options={[['', 'All statuses'], ['open', 'Open'], ['solved', 'Solved']]} value={filter.status} onChange={(e) => update('status', e.target.value)} aria-label="Status" />
        <Select options={[['', 'Any language'], ...LANGUAGES]} value={filter.language} onChange={(e) => update('language', e.target.value)} aria-label="Language" />
        <div className="tabs full">
          {[['new', 'Newest'], ['top', 'Top voted'], ['unanswered', 'Unanswered']].map(([k, t]) => (
            <button key={k} className={`tab ${filter.sort === k ? 'active' : ''}`} onClick={() => update('sort', k === 'new' ? '' : k)}>{t}</button>
          ))}
          {filter.tag && <button className="tab active" onClick={() => update('tag', '')}>#{filter.tag} ✕</button>}
        </div>
      </div>
      <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="No questions found">
        <div className="stack">{data?.map((qn) => <QuestionCard key={qn.id} question={qn} />)}</div>
      </Loader>
      {asking && <QuestionForm onClose={() => setAsking(false)} />}
    </>
  )
}

// Create or edit (when `question` is given) a question with its tags.
export function QuestionForm({ question, onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: question?.title || '', description: question?.description || '', code: question?.code || '', language: question?.language || '',
  })
  const [tags, setTags] = useState(question?.question_tags?.map((t) => t.tag) || [])
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.title.trim().length < 10) return toast('Title must be at least 10 characters', 'error')
    setBusy(true)
    try {
      const clean = tags.map((t) => t.toLowerCase().replace(/[^a-z0-9+#.-]/g, '-').slice(0, 30)).filter(Boolean)
      const saved = question
        ? await q(supabase.from('questions').update(form).eq('id', question.id).select().single())
        : await q(supabase.from('questions').insert({ ...form, author_id: user.id }).select().single())
      await q(supabase.from('question_tags').delete().eq('question_id', saved.id))
      if (clean.length) await q(supabase.from('question_tags').insert([...new Set(clean)].map((tag) => ({ question_id: saved.id, tag }))))
      onClose()
      if (question) onSaved?.()
      else navigate(`/questions/${saved.id}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={question ? 'Edit question' : 'Ask a question'} onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        <Field label="Title" hint="Be specific — at least 10 characters"><input className="input" required value={form.title} onChange={set('title')} maxLength={200} /></Field>
        <Field label="Description"><textarea className="textarea" required value={form.description} onChange={set('description')} style={{ minHeight: 140 }} /></Field>
        <Field label="Code (optional)"><textarea className="textarea code" value={form.code} onChange={set('code')} spellCheck={false} /></Field>
        <div className="form-grid">
          <Field label="Language"><Select options={[['', '—'], ...LANGUAGES]} value={form.language} onChange={set('language')} /></Field>
          <Field label="Tags"><TagInput value={tags} onChange={setTags} placeholder="react, hooks…" /></Field>
        </div>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : question ? 'Save changes' : 'Post question'}</button>
      </form>
    </Modal>
  )
}
