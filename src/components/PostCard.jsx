import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { safeUrl, timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, CodeBlock, Menu, UserLink } from './ui'
import { ReportItem, SaveButton } from './actions'
import CommentSection from './CommentSection'
import PostComposer from './PostComposer'

export default function PostCard({ post: initial, onDeleted, canModerate = false, expanded = false }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [post, setPost] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [showComments, setShowComments] = useState(expanded)
  const mine = post.author_id === user.id
  const canDelete = mine || canModerate || profile.is_admin

  const toggleLike = async () => {
    const liked = !post.liked
    setPost((p) => ({ ...p, liked, likes_count: p.likes_count + (liked ? 1 : -1) }))
    const { error } = liked
      ? await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      : await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    if (error) {
      setPost((p) => ({ ...p, liked: !liked, likes_count: p.likes_count + (liked ? -1 : 1) }))
      toast(error.message, 'error')
    }
  }

  const remove = async () => {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) return toast(error.message, 'error')
    toast('Post deleted')
    onDeleted?.(post.id)
  }

  const share = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`)
    toast('Link copied to clipboard')
  }

  return (
    <article className="card">
      <div className="post-head">
        <Link to={`/developers/${post.author?.username}`}><Avatar profile={post.author} size={42} /></Link>
        <div className="who">
          <div className="row" style={{ gap: 6 }}>
            <UserLink profile={post.author}><span className="name">{post.author?.full_name || post.author?.username}</span></UserLink>
            {post.author?.level && <span className="chip" style={{ padding: '0 8px' }}>{post.author.level}</span>}
          </div>
          <div className="faint small">
            <Link to={`/posts/${post.id}`}>{timeAgo(post.created_at)}</Link>
            {post.updated_at && ' · edited'}
            {post.group && <> · in <Link to={`/groups/${post.group.id}`} className="link">{post.group.name}</Link></>}
          </div>
        </div>
        <Menu>
          {mine && <button onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>}
          {canDelete && <button className="danger" onClick={remove}><Trash2 size={15} /> Delete</button>}
          <button onClick={share}><Share2 size={15} /> Copy link</button>
          {!mine && <ReportItem type="post" id={post.id} />}
        </Menu>
      </div>

      {editing ? (
        <PostComposer post={post} onCancel={() => setEditing(false)} onSaved={(p) => { setPost(p); setEditing(false) }} />
      ) : (
        <>
          {post.content && <div className="post-body prewrap">{post.content}</div>}
          <CodeBlock code={post.code} language={post.language} clamp={!expanded} />
          {post.language && !post.code && <span className="chip tag">#{post.language.toLowerCase()}</span>}
          {post.image_urls?.length > 0 && (
            <div className="post-images">{post.image_urls.map((u) => <img key={u} src={u} alt="" loading="lazy" />)}</div>
          )}
          {post.project_link && (
            <a className="chip blue" href={safeUrl(post.project_link)} target="_blank" rel="noreferrer noopener" style={{ marginTop: 6 }}>
              <ExternalLink size={13} /> {post.project_link.replace(/^https?:\/\//, '')}
            </a>
          )}
        </>
      )}

      <div className="post-actions">
        <button className={`icon-btn ${post.liked ? 'on' : ''}`} onClick={toggleLike} aria-pressed={post.liked} aria-label={post.liked ? 'Unlike' : 'Like'}>
          <Heart size={17} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes_count}
        </button>
        <button className="icon-btn" onClick={() => setShowComments(!showComments)} aria-expanded={showComments}>
          <MessageCircle size={17} /> {post.comments_count}
        </button>
        <button className="icon-btn" onClick={share} aria-label="Copy link"><Share2 size={17} /></button>
        <span className="grow" />
        <SaveButton type="post" id={post.id} />
      </div>
      {showComments && (
        <div style={{ marginTop: 12 }}>
          <CommentSection target={{ post_id: post.id }} canModerate={canModerate || profile.is_admin}
            onCountChange={(d) => setPost((p) => ({ ...p, comments_count: p.comments_count + d }))} />
        </div>
      )}
    </article>
  )
}
