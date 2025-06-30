const CACHE_NAME = 'minha-lista-de-compras-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/anims.css',
    '/script.js',
    '/assets/bubble2.mp3',
    '/assets/clear.mp3',
    '/assets/favicon.png',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
    'https://cdn.jsdelivr.net/npm/autonumeric@4.9.0/dist/autoNumeric.min.js'
];

self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cache aberto, adicionando URLs...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[Service Worker] Falha ao adicionar URLs ao cache:', error);
            })
    );
});

self.addEventListener('fetch', event => {

    if (event.request.url.startsWith(self.location.origin) || 
        urlsToCache.some(url => event.request.url.includes(new URL(url).host && new URL(url).pathname === new URL(event.request.url).pathname))) {
        
        event.respondWith(
            caches.match(event.request)
                .then(response => {

                    if (response) {
                        console.log(`[Service Worker] Servindo do cache: ${event.request.url}`);
                        return response;
                    }

                    console.log(`[Service Worker] Buscando da rede e cacheando: ${event.request.url}`);
                    return fetch(event.request).then(
                        networkResponse => {

                            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }

                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return networkResponse;
                        }
                    ).catch(error => {
                        console.error('[Service Worker] Falha na requisição de rede:', event.request.url, error);
                    });
                })
        );
    }
});

self.addEventListener('activate', event => {
    console.log('[Service Worker] Ativando Service Worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});