// Quick Comms picture keeper.
//
// Keeps the app's own pictures (POV screenshots in pov/, minimaps in maps/) on this device after their first
// download, and shows them from there with no trip to the server. GitHub Pages only lets browsers keep files for 10
// minutes, which made pictures slow on mobile data.
//
// It answers picture requests and nothing else: the app's pages and code always come from the network, so every
// deploy shows up straight away. Each picture's address carries a version (?v=), so a changed picture is a new
// address and downloads once. Old versions are cleared by the app (src/pictures.ts).
//
// To switch it off for everyone, replace this file with one that calls self.registration.unregister() (docs/upkeep.md).

// The beta build names its own cache in this file's address (src/pictures.ts), since caches are shared per origin.
const CACHE = new URL(self.location.href).searchParams.get('cache') || 'qc-pictures-v1'
const PICTURE = /\/(pov|maps)\/.+\.(webp|png)$/

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !PICTURE.test(url.pathname)) return
  event.respondWith(
    caches
      .open(CACHE)
      .then(async (cache) => {
        const kept = await cache.match(request)
        if (kept) return kept
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone()).catch(() => {})
        return response
      })
      // If the cache itself fails, behave as if this file didn't exist.
      .catch(() => fetch(request)),
  )
})
