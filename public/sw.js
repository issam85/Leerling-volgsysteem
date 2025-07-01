// MijnLVS Service Worker
// Version 1.0.0

const CACHE_NAME = 'mijnlvs-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/offline.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Dynamic cache patterns
const CACHE_PATTERNS = {
  // Cache API responses for offline access
  api: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
  // Cache static assets
  static: /\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/,
  // Cache images
  images: /\.(png|jpg|jpeg|svg|gif|webp)$/
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker version:', CACHE_NAME);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching static assets');
        await cache.addAll(STATIC_CACHE_URLS);
        console.log('[SW] Static assets cached successfully');
      } catch (error) {
        console.error('[SW] Failed to cache static assets:', error);
      }
    })()
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker version:', CACHE_NAME);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name !== CACHE_NAME && name.startsWith('mijnlvs-')
      );
      
      if (oldCaches.length > 0) {
        console.log('[SW] Cleaning up old caches:', oldCaches);
        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Take control of all clients
      await self.clients.claim();
      console.log('[SW] Service Worker activated and ready');
    })()
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different request types
  if (CACHE_PATTERNS.api.test(url.href)) {
    // API requests - Cache with network first strategy
    event.respondWith(handleApiRequest(request));
  } else if (CACHE_PATTERNS.static.test(url.pathname)) {
    // Static assets - Cache first strategy
    event.respondWith(handleStaticRequest(request));
  } else if (url.origin === location.origin) {
    // Same-origin requests - Stale while revalidate
    event.respondWith(handleSameOriginRequest(request));
  }
});

// Network first strategy for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', request.url);
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline - Deze gegevens zijn niet beschikbaar offline',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache first strategy for static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    
    // Return a fallback for failed static assets
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="50" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="12" fill="#6b7280">Afbeelding niet beschikbaar</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Stale while revalidate for same-origin requests
async function handleSameOriginRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Get cached version immediately
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkResponsePromise = fetch(request).then(response => {
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('[SW] Network request failed:', request.url);
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, wait for network
  try {
    const networkResponse = await networkResponsePromise;
    if (networkResponse) {
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for same-origin request:', request.url);
  }
  
  // If all fails and it's a navigation request, show offline page
  if (request.mode === 'navigate') {
    const offlineResponse = await cache.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  throw new Error('No cached response available and network failed');
}

// Background sync for form submissions (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // This will be implemented for offline form submissions
  console.log('[SW] Handling background sync - feature coming soon');
}

// Push notifications handler (future enhancement)
self.addEventListener('push', event => {
  console.log('[SW] Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nieuwe notificatie van MijnLVS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Bekijk',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Sluiten',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MijnLVS', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});