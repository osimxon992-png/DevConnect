import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, MoreHorizontal, Inbox } from 'lucide-react'

export function Avatar({ profile, size = 40, ring = false }) {
  const style = { width: size, height: size, fontSize: size * 0.4 }
  const cls = `avatar${ring ? ' ring' : ''}`
  if (profile?.avatar_url) return <img className={cls} style={style} src={profile.avatar_url} alt={profile.username} />
  return <span className={cls} style={style} aria-hidden>{(profile?.full_name || profile?.username || '?')[0].toUpperCase()}</span>
}

export function UserLink({ profile, children }) {
  if (!profile) return <span className="faint">deleted user</span>
  return <Link to={`/developers/${profile.username}`}>{children ?? `@${profile.username}`}</Link>
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  // portal: a transformed ancestor would otherwise break position: fixed
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 720 } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  )
}

export function Select({ options, ...props }) {
  return (
    <select className="select" {...props}>
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return <option key={v} value={v}>{l}</option>
      })}
    </select>
  )
}

export function Spinner() { return <div className="spinner" aria-label="Loading" /> }

export function Empty({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="empty">
      <Icon size={36} />
      <h3>{title}</h3>
      {children && <div className="small">{children}</div>}
    </div>
  )
}

export function ErrorBox({ error }) {
  return error ? <div className="alert">{error.message || String(error)}</div> : null
}

// Shows spinner/error/empty states so pages only render the happy path.
export function Loader({ loading, error, empty, emptyTitle = 'Nothing here yet', emptyText, children }) {
  if (loading) return <Spinner />
  if (error) return <ErrorBox error={error} />
  if (empty) return <Empty title={emptyTitle}>{emptyText}</Empty>
  return children
}

export function Menu({ children, label = 'More actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div className="menu" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label={label} aria-expanded={open}><MoreHorizontal size={18} /></button>
      {open && <div className="menu-pop" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  )
}

// Comma-separated chip input, e.g. technologies or tags.
export function TagInput({ value, onChange, placeholder = 'Type and press Enter', suggestions = [] }) {
  const [text, setText] = useState('')
  const add = (t) => {
    const v = t.trim().replace(/,$/, '')
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v])
    setText('')
  }
  const listId = useRef(`tags-${Math.random().toString(36).slice(2)}`).current
  return (
    <div className="stack" style={{ gap: 8 }}>
      <input
        className="input" value={text} placeholder={placeholder} list={suggestions.length ? listId : undefined}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(text) }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={() => text && add(text)}
      />
      {suggestions.length > 0 && <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
      {value.length > 0 && (
        <div className="row wrap">
          {value.map((t) => (
            <span key={t} className="chip tag">{t}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function CodeBlock({ code, language, clamp }) {
  const [copied, setCopied] = useState(false)
  if (!code) return null
  return (
    <div className={`code${clamp ? ' clamp' : ''}`}>
      <div className="code-head">
        <span>{language || 'code'}</span>
        <button className="icon-btn small" type="button" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

export function ImagePicker({ files, onChange, max = 4 }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      <input type="file" accept="image/*" multiple={max > 1} className="input"
        onChange={(e) => onChange([...files, ...e.target.files].slice(0, max))} />
      {files.length > 0 && (
        <div className="row wrap">
          {files.map((f, i) => (
            <span key={i} className="chip">{f.name}
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label="Remove image"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
