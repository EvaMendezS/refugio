/**
 * REFUGIO — service-worker.js
 * ------------------------------------------------------------------
 * Cachea el "app shell" completo para que Refugio funcione 100%
 * offline luego de la primera visita, y sea instalable como PWA.
 *
 * Estrategia: cache-first con actualización en segundo plano
 * (stale-while-revalidate simplificado) para los assets propios.
 * Al no depender de ningún recurso externo (CDN), el offline es
 * total desde la primera carga.
 *
 * IMPORTANTE: subir la versión de CACHE_NAME cada vez que se
 * modifique algún archivo del app shell, para forzar la actualización
 * del cache en los dispositivos de los usuarios.
 * ------------------------------------------------------------------
 */

'use strict';

const CACHE_NAME = 'refugio-cache-v7';

// Rutas relativas: funcionan tanto en la raíz como en un subpath de
// GitHub Pages (ej: usuario.github.io/refugio/).
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './data.js',
  './content.js',
  './js/app.js',
  './js/storage.js',
  './js/ui.js',
  './js/analytics.js',
  './js/pdf.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png',
  './assets/icon-192-maskable.png',
  './assets/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET del propio origen.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Actualizamos el cache en segundo plano con la versión fresca.
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // sin conexión: nos quedamos con el cache

      // Cache-first: si hay copia local, se sirve inmediatamente.
      return cachedResponse || fetchPromise;
    })
  );
});