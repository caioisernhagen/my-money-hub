const CACHE_VERSION = "v" + Date.now(); // Gera versão única a cada deploy
const STATIC_CACHE = "static-" + CACHE_VERSION;
const DYNAMIC_CACHE = "dynamic-" + CACHE_VERSION;

// Detecta o basePath dinamicamente
const isProduction = !self.location.pathname.startsWith("/service-worker");
const basePath = self.location.pathname.includes("/my-money-hub/")
  ? "/my-money-hub"
  : "";

// Arquivos essenciais que devem estar sempre em cache
const STATIC_ASSETS = [
  basePath + "/",
  basePath + "/index.html",
  basePath + "/manifest.json",
];

// Instala e cacheia apenas arquivos estáticos essenciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Se falhar, continua sem bloquear
        return Promise.resolve();
      });
    }),
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k)),
      );
    }),
  );
  self.clients.claim();
});

// Estratégia: Network First para APIs e assets, Cache First para HTML
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignorar requisições não-GET
  if (event.request.method !== "GET") {
    return;
  }

  // Para APIs (supabase), usar network-first
  if (url.hostname.includes("supabase")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            // Clona ANTES de retornar
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Para arquivos de assets com hash (vite), usar network-first
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            // Clona ANTES de retornar
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Para páginas HTML e outros recursos, cache-first com fallback para network
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            // Clona ANTES de retornar
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Se tudo falhar, retorna index.html para SPA routing
        return caches.match(basePath + "/index.html");
      }),
  );
});
