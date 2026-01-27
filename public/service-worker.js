const CACHE_VERSION = "v" + Date.now(); // Gera versão única a cada deploy
const STATIC_CACHE = "static-" + CACHE_VERSION;
const DYNAMIC_CACHE = "dynamic-" + CACHE_VERSION;

// Arquivos essenciais que devem estar sempre em cache
const STATIC_ASSETS = ["/my-money-hub/", "/my-money-hub/index.html"];

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

// Estratégia: Network First para APIs, Cache First para assets estáticos
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Para arquivos de assets com hash (vite), usar network-first
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tenta cache
          return caches.match(event.request);
        }),
    );
  } else {
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
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Se tudo falhar, retorna index.html para SPA routing
          return caches.match("/my-money-hub/index.html");
        }),
    );
  }
});
