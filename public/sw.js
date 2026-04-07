// public/sw.js
const CACHE_NAME = 'tour-assets-v1';
const ASSETS_TO_CACHE = [
  // Images
  '/assets/images/home-bg.png',
  '/assets/images/building.png',
  '/assets/images/image-3.png',
  '/assets/images/image-4.png',
  '/assets/images/image-5.png',
  '/assets/images/image-6.png',
  '/assets/images/Image-exterior.png',
  '/assets/images/territory.png',
  '/assets/images/yoga.jpg',
  '/assets/images/bnw-logo.png',
  '/assets/images/floorplan.png',
  '/assets/images/360-bg.png',
  '/assets/images/Entrance_VRay.jpg',
  '/assets/images/sofa_new.jpg',
  '/assets/images/living_door.jpg',
  '/assets/images/Corrior.jpg',
  '/assets/images/kitchen_doo-1.jpg',
  '/assets/images/kitchen_main.jpg',
  '/assets/images/Bedroom_Entrance.jpg',
  '/assets/images/Bedroom_Main.jpg',
  '/assets/images/Bathroom_1.jpg',
  '/assets/images/Bedroom_Entrance_1.jpg',
  '/assets/images/Kitchen_Entrance_2.jpg',
  
  // Icons
  '/assets/icons/bed-single-02.png',
  '/assets/icons/left-arrow.png',
  '/assets/icons/right-arrow.png',
  '/assets/icons/beach.png',
  '/assets/icons/tree-02.png',
  '/assets/icons/yoga-02.png',
  '/assets/icons/pool.png',
  '/assets/icons/3d-rotate.png',
  '/assets/icons/arrow-expand.png',
  '/assets/icons/arrow-shrink.png',
  
  // Videos
  '/assets/movies/movie_taj.mp4',
  '/assets/movies/home-bg-video.mp4',
  
  // Models
  '/assets/models/floorplan_wall.glb',
  '/assets/models/floorplan_glass.glb'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only cache GET requests for assets
  if (event.request.method === 'GET' && 
      event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        })
    );
  }
});

// Register for background sync to preload assets
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PRELOAD_ASSETS') {
    event.waitUntil(preloadAssets());
  }
});

async function preloadAssets() {
  const cache = await caches.open(CACHE_NAME);
  const requests = ASSETS_TO_CACHE.map(url => new Request(url));
  
  for (const request of requests) {
    try {
      const response = await cache.match(request);
      if (!response) {
        await cache.add(request);
      }
    } catch (error) {
      console.error('Failed to preload:', request.url, error);
    }
  }
}