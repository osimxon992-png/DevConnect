import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function SearchBar({ placeholder = 'Search developers, posts, questions, projects…' }) {
  const [params] = useSearchParams()
  const [text, setText] = useState(params.get('q') || '')
  const navigate = useNavigate()
  useEffect(() => setText(params.get('q') || ''), [params])
  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(text.trim())}`) }}>
      <Search size={17} />
      <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label="Search" />
    </form>
  )
}
