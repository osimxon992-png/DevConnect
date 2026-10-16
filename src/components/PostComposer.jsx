import { useState } from 'react'
import { Code2, ImagePlus, Link2, Send } from 'lucide-react'
import { supabase, uploadFile } from '../lib/supabase'
import { LANGUAGES } from '../lib/constants'
import { POST_SELECT } from '../lib/posts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, ImagePicker, Select } from './ui'

// Creates a post (optionally inside a group) or edits an existing one when `post` is given.
export default function PostComposer({ groupId = null, post, onSaved, onCancel }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [content, setContent] = useState(post?.content || '')
  const [code, setCode] = useState(post?.code || '')
  const [language, setLanguage] = useState(post?.language || '')
  const [projectLink, setProjectLink] = useState(post?.project_link || '')
  const [files, setFiles] = useState([])
  const [keepImages, setKeepImages] = useState(post?.image_urls || [])
  const [show, setShow] = useState({ code: Boolean(post?.code), images: false, link: Boolean(post?.project_link) })
  const [busy, setBusy] = useState(false)

  const empty = !content.trim() && !code.trim() && !files.length && !keepImages.length
  const submit = async (e) => {
    e.preventDefault()
    if (empty) return
    setBusy(true)
    try {
      const uploaded = await Promise.all(files.map((f) => uploadFile(user.id, f, 'posts')))
      const fields = {
        content: content.trim(), code: code.trimEnd(), language,
        project_link: projectLink.trim(), image_urls: [...keepImages, ...uploaded],
      }
      const { data, error } = post
        ? await supabase.from('posts').update(fields).eq('id', post.id).select(POST_SELECT).single()
        : await supabase.from('posts').insert({ ...fields, author_id: user.id, group_id: groupId }).select(POST_SELECT).single()
      if (error) throw error
      onSaved?.({ ...data, liked: post?.liked ?? false })
      if (!post) {
        setContent(''); setCode(''); setLanguage(''); setProjectLink(''); setFiles([])
        setShow({ code: false, images: false, link: false })
      }
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (k) => setShow({ ...show, [k]: !show[k] })
  return (
    <form className={post ? 'stack' : 'card stack'} onSubmit={submit}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        {!post && <Avatar profile={profile} size={40} />}
        <textarea className="textarea" placeholder={groupId ? 'Share something with the group…' : 'Share what you are building, learning or stuck on…'}
          value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} style={{ minHeight: 70 }} aria-label="Post text" />
      </div>
      {show.code && (
        <div className="stack" style={{ gap: 8 }}>
          <Select options={[['', 'Language tag'], ...LANGUAGES]} value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Code language" />
          <textarea className="textarea code" placeholder="Paste your code snippet" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label="Code snippet" />
        </div>
      )}
      {keepImages.length > 0 && (
        <div className="row wrap">
          {keepImages.map((url) => (
            <span key={url} className="chip">image
              <button type="button" onClick={() => setKeepImages(keepImages.filter((u) => u !== url))} aria-label="Remove image">×</button>
            </span>
          ))}
        </div>
      )}
      {show.images && <ImagePicker files={files} onChange={setFiles} max={4 - keepImages.length} />}
      {show.link && <input className="input" placeholder="Project link (https://…)" value={projectLink} onChange={(e) => setProjectLink(e.target.value)} />}
      <div className="row between">
        <div className="row" style={{ gap: 2 }}>
          <button type="button" className={`icon-btn ${show.code ? 'on' : ''}`} onClick={() => toggle('code')} title="Add code"><Code2 size={18} /><span className="small">Code</span></button>
          <button type="button" className={`icon-btn ${show.images ? 'on' : ''}`} onClick={() => toggle('images')} title="Add images"><ImagePlus size={18} /><span className="small">Image</span></button>
          <button type="button" className={`icon-btn ${show.link ? 'on' : ''}`} onClick={() => toggle('link')} title="Add project link"><Link2 size={18} /><span className="small">Link</span></button>
        </div>
        <div className="row">
          {onCancel && <button type="button" className="btn ghost sm" onClick={onCancel}>Cancel</button>}
          <button className="btn primary sm" disabled={busy || empty}><Send size={15} /> {post ? 'Save' : 'Post'}</button>
        </div>
      </div>
    </form>
  )
}
