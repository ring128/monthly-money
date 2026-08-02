const sw = self as unknown as ServiceWorkerGlobalScope;
const cacheName = "monthly-money-memo-v1";

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon.svg"]))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached ?? caches.match("./index.html"))
          .then((fallback) => fallback ?? new Response("Offline", { status: 503 }))
      )
  );
});
