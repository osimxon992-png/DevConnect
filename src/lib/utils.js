export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  const units = [[31536000, 'y'], [2592000, 'mo'], [604800, 'w'], [86400, 'd'], [3600, 'h'], [60, 'm']]
  for (const [sec, u] of units) if (s >= sec) return `${Math.floor(s / sec)}${u} ago`
}

export const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

// "react, Node.js ,  sql" -> ['react', 'Node.js', 'sql']
export const splitList = (str) => [...new Set(str.split(',').map((s) => s.trim()).filter(Boolean))]

export const safeUrl = (url) => (/^https?:\/\//i.test(url || '') ? url : url ? `https://${url}` : '')

// Escape user text before using it inside a PostgREST or() filter.
export const like = (term) => `%${term.replace(/[%_,()]/g, ' ').trim()}%`
