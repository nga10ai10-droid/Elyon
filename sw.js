// ELYON Professional Gym Service Worker v3.1.0
const CACHE_NAME = 'elyon-gym-v3-1';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/js/app.js',
  '/images/logo.png',
  '/images/logo-small.png',
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png',
  '/images/apple-touch-icon.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Oswald:wght@300;400;500;600;700&display=swap'
];

// Install event
self.addEventListener('install', event => {
  console.log('🏋️ ELYON Professional Gym Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching professional gym assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request for fetching
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response for caching
          const responseToCache = response.clone();

          // Cache new responses
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.error('Fetch failed:', error);
          // Return offline fallback if available
          return caches.match('/offline.html') || new Response('Offline');
        });
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('✅ ELYON Professional Gym Service Worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForm());
  }
  if (event.tag === 'newsletter-sync') {
    event.waitUntil(syncNewsletter());
  }
});

// Sync functions
async function syncContactForm() {
  try {
    // Implementation for syncing contact form when back online
    console.log('Syncing contact form submissions...');
  } catch (error) {
    console.error('Contact form sync failed:', error);
  }
}

async function syncNewsletter() {
  try {
    // Implementation for syncing newsletter subscriptions when back online
    console.log('Syncing newsletter subscriptions...');
  } catch (error) {
    console.error('Newsletter sync failed:', error);
  }
}