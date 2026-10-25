// Chrome only offers "Install app" when a fetch handler exists. Network-only, no cache, so Supabase data never goes stale.
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request))
})
