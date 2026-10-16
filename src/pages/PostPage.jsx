import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { POST_SELECT, loadPosts } from '../lib/posts'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '../hooks/useQuery'
import { Loader } from '../components/ui'
import PostCard from '../components/PostCard'

export default function PostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(
    () => loadPosts(supabase.from('posts').select(POST_SELECT).eq('id', id), user.id), [id, user.id])
  return (
    <Loader loading={loading} error={error} empty={!data?.length} emptyTitle="Post not found"
      emptyText="It may have been deleted, or the author's profile is private.">
      {data && data[0] && <PostCard key={data[0].id} post={data[0]} expanded onDeleted={() => navigate('/home')} />}
    </Loader>
  )
}
