const staticCacheName = "lira-v1"
const assets = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/lira.js",
  "/manifest.json",
  "/images/favicon.png",
  "/images/icons/icon-72x72.png",
  "/images/icons/icon-96x96.png",
  "/images/icons/icon-128x128.png",
  "/images/icons/icon-144x144.png",
  "/images/icons/icon-152x152.png",
  "/images/icons/icon-192x192.png",
  "/images/icons/icon-384x384.png",
  "/images/icons/icon-512x512.png",
  
  "/src/config/config.js",
  "/src/config/routes.js",
  "/src/components/links.js",
  "/src/view/index.js",
  "/src/view/errors/not-found.js"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticCacheName).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
      caches.match(fetchEvent.request).then(res => {
        return res || fetch(fetchEvent.request)
      })
    )
})