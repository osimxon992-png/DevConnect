import { supabase, q } from './supabase'
import { PROFILE_FIELDS } from './constants'

export const POST_SELECT = `*, author:profiles(${PROFILE_FIELDS}), group:groups(id, name)`

// Adds `liked` to each post with one extra query.
export async function withMyLikes(posts, userId) {
  if (!posts.length) return posts
  const likes = await q(supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', posts.map((p) => p.id)))
  const set = new Set(likes.map((l) => l.post_id))
  return posts.map((p) => ({ ...p, liked: set.has(p.id) }))
}

export async function loadPosts(query, userId) {
  return withMyLikes(await q(query), userId)
}
