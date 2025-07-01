const CACHE_NAME = 'minha-lista-de-compras-cache-v2';
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
    'https://fonts.gstatic.com/s/materialsymbolsrounded/v182/sykg-zNym6YFILj8H7MfdFI_g0KuENgwLSzmXZlC_9CR.woff2',
    'https://cdn.jsdelivr.net/npm/autonumeric@4.9.0/dist/autoNumeric.min.js'
];

self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...'); // Log adicionado
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cache aberto, adicionando URLs:', urlsToCache); // Log adicionado
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[Service Worker] Falha ao adicionar URLs ao cache:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    console.log('[Service Worker] Interceptando requisição:', event.request.url); // Log adicionado
    if (event.request.url.startsWith(self.location.origin) || 
        urlsToCache.some(url => event.request.url.includes(new URL(url).host && new URL(url).pathname === new URL(event.request.url).pathname))) {
        
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('[Service Worker] Servindo do cache:', event.request.url); // Log adicionado
                        return response;
                    }
                    
                    return fetch(event.request).then(
                        networkResponse => {
                            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                console.log('[Service Worker] Resposta de rede não cacheável ou erro:', event.request.url); // Log adicionado
                                return networkResponse;
                            }
                            
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    console.log('[Service Worker] Adicionando à cache da rede:', event.request.url); // Log adicionado
                                    cache.put(event.request, responseToCache);
                                });
                            return networkResponse;
                        }
                    ).catch(error => {
                        console.error('[Service Worker] Falha na requisição de rede:', event.request.url, error);
                        // Você pode adicionar um fallback para uma página offline aqui, se desejar
                    });
                })
        );
    }
});

self.addEventListener('activate', event => {
    console.log('[Service Worker] Ativando...'); // Log adicionado
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deletando cache antigo:', cacheName); // Log adicionado
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});