const CACHE_NAME = 'sg-lodejuan-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/style.css',
    '/products.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

// Instalar Service Worker y añadir archivos a la caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // Agrega todos los archivos necesarios para el funcionamiento offline
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar peticiones para servir desde la caché
self.addEventListener('fetch', event => {
    // Solo cachear peticiones GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Caché hit - devolver respuesta
                if (response) {
                    return response;
                }
                
                // No hay respuesta en caché, buscar en red
                return fetch(event.request).then(
                    networkResponse => {
                        // Comprobar si recibimos una respuesta válida
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Si la URL es una URL de la CDN o un archivo local, la clonamos y la guardamos en caché
                        if (urlsToCache.some(url => event.request.url.includes(url) || event.request.url.startsWith(self.location.origin))) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    }
                ).catch(() => {
                    // Si falla la red, podemos mostrar una página de fallback
                    // return caches.match('/offline.html');
                });
            })
    );
});

// Actualización de caché
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});