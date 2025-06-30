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
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('Falha ao adicionar URLs ao cache:', error);
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
                        return response;
                    }
                    
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
                        console.error('Falha na requisição de rede:', event.request.url, error);
                    });
                })
        );
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});