/**
 * Service Worker for This or That App
 * Provides offline caching and performance optimizations
 */

const CACHE_NAME = 'this-or-that-v1.1.0';
const STATIC_CACHE_NAME = 'this-or-that-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'this-or-that-dynamic-v1.1.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
	'/',
	'/index.html',
	'/css/main.css',
	'/css/responsive.css',
	'/css/print.css',
	'/js/app.js',
	'/js/timer.js',
	'/js/results.js',
	'/js/email.js',
	'/js/print.js',
	'/js/app-data-loader.js',
	'/js/data-validator.js',
	'/data/sample-designs.json'
];

// Dynamic assets to cache on request
const DYNAMIC_CACHE_PATTERNS = [
	/\/data\/.*\.json$/,
	/\/assets\/.*\.(png|jpg|jpeg|webp|svg)$/,
	/https:\/\/cdn\.land-book\.com\/.*\.(png|jpg|jpeg|webp)$/
];

// Install event - cache static assets
self.addEventListener('install', event => {
	console.log('🔧 Service Worker installing...');

	event.waitUntil(
		caches.open(STATIC_CACHE_NAME)
			.then(cache => {
				console.log('📦 Caching static assets...');
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => {
				console.log('✅ Static assets cached successfully');
				return self.skipWaiting();
			})
			.catch(error => {
				console.error('❌ Failed to cache static assets:', error);
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
	console.log('🚀 Service Worker activating...');

	event.waitUntil(
		caches.keys()
			.then(cacheNames => {
				return Promise.all(
					cacheNames.map(cacheName => {
						if (cacheName !== STATIC_CACHE_NAME &&
							cacheName !== DYNAMIC_CACHE_NAME &&
							cacheName.startsWith('this-or-that-')) {
							console.log('🗑️ Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('✅ Service Worker activated');
				return self.clients.claim();
			})
	);
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') {
		return;
	}

	// Skip external APIs (except Land-book images)
	if (url.origin !== location.origin && !url.hostname.includes('land-book.com')) {
		return;
	}

	event.respondWith(
		handleFetchRequest(request)
	);
});

/**
 * Handles fetch requests with caching strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function handleFetchRequest(request) {
	const url = new URL(request.url);

	try {
		// Strategy 1: Cache First for static assets
		if (isStaticAsset(url.pathname)) {
			return await cacheFirst(request);
		}

		// Strategy 2: Network First for dynamic content
		if (isDynamicAsset(url.pathname) || url.hostname.includes('land-book.com')) {
			return await networkFirst(request);
		}

		// Strategy 3: Stale While Revalidate for JSON data
		if (url.pathname.endsWith('.json')) {
			return await staleWhileRevalidate(request);
		}

		// Default: Network with cache fallback
		return await networkWithCacheFallback(request);

	} catch (error) {
		console.error('❌ Fetch error:', error);
		return await getCachedResponse(request) || createOfflineResponse(request);
	}
}

/**
 * Cache First strategy - serve from cache, fallback to network
 * @param {Request} request - The request
 * @returns {Promise<Response>} - The response
 */
async function cacheFirst(request) {
	const cachedResponse = await caches.match(request);

	if (cachedResponse) {
		return cachedResponse;
	}

	const networkResponse = await fetch(request);

	if (networkResponse.ok) {
		const cache = await caches.open(STATIC_CACHE_NAME);
		cache.put(request, networkResponse.clone());
	}

	return networkResponse;
}

/**
 * Network First strategy - try network, fallback to cache
 * @param {Request} request - The request
 * @returns {Promise<Response>} - The response
 */
async function networkFirst(request) {
	try {
		const networkResponse = await fetch(request, {
			headers: {
				'Cache-Control': 'no-cache'
			}
		});

		if (networkResponse.ok) {
			const cache = await caches.open(DYNAMIC_CACHE_NAME);
			cache.put(request, networkResponse.clone());
			return networkResponse;
		}

		throw new Error(`Network response not ok: ${networkResponse.status}`);

	} catch (error) {
		console.warn('⚠️ Network failed, trying cache:', error.message);
		const cachedResponse = await caches.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		throw error;
	}
}

/**
 * Stale While Revalidate strategy - serve from cache, update in background
 * @param {Request} request - The request
 * @returns {Promise<Response>} - The response
 */
async function staleWhileRevalidate(request) {
	const cachedResponse = await caches.match(request);

	// Start network request in background
	const networkPromise = fetch(request)
		.then(response => {
			if (response.ok) {
				const cache = caches.open(DYNAMIC_CACHE_NAME);
				cache.then(c => c.put(request, response.clone()));
			}
			return response;
		})
		.catch(error => {
			console.warn('⚠️ Background update failed:', error.message);
		});

	// Return cached response immediately if available
	if (cachedResponse) {
		return cachedResponse;
	}

	// Otherwise wait for network
	return networkPromise;
}

/**
 * Network with cache fallback strategy
 * @param {Request} request - The request
 * @returns {Promise<Response>} - The response
 */
async function networkWithCacheFallback(request) {
	try {
		const networkResponse = await fetch(request);
		return networkResponse;
	} catch (error) {
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}
		throw error;
	}
}

/**
 * Gets cached response for a request
 * @param {Request} request - The request
 * @returns {Promise<Response|null>} - Cached response or null
 */
async function getCachedResponse(request) {
	return await caches.match(request);
}

/**
 * Creates an offline response for failed requests
 * @param {Request} request - The request
 * @returns {Response} - Offline response
 */
function createOfflineResponse(request) {
	const url = new URL(request.url);

	// For HTML requests, return offline page
	if (request.headers.get('accept')?.includes('text/html')) {
		return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - This or That</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>This or That requires an internet connection to load new content.</p>
            <p>Please check your connection and try again.</p>
            <button onclick="location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
			status: 200,
			headers: { 'Content-Type': 'text/html' }
		});
	}

	// For image requests, return placeholder
	if (request.headers.get('accept')?.includes('image/')) {
		return createImagePlaceholderResponse();
	}

	// For JSON requests, return empty data
	if (url.pathname.endsWith('.json')) {
		return new Response(JSON.stringify({
			designs: [],
			error: 'Offline - no cached data available'
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Default offline response
	return new Response('Offline', {
		status: 503,
		statusText: 'Service Unavailable'
	});
}

/**
 * Creates a placeholder image response for offline mode
 * @returns {Response} - Image placeholder response
 */
function createImagePlaceholderResponse() {
	const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="16" fill="#666666" text-anchor="middle">
        Image Unavailable
      </text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#999999" text-anchor="middle">
        Offline Mode
      </text>
      <circle cx="200" cy="120" r="20" fill="none" stroke="#ccc" stroke-width="2"/>
      <path d="M190 120 L200 130 L210 110" stroke="#ccc" stroke-width="2" fill="none"/>
    </svg>
  `;

	return new Response(svg, {
		status: 200,
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}

/**
 * Checks if a path is a static asset
 * @param {string} pathname - The pathname to check
 * @returns {boolean} - True if static asset
 */
function isStaticAsset(pathname) {
	return pathname.endsWith('.css') ||
		pathname.endsWith('.js') ||
		pathname.endsWith('.html') ||
		pathname === '/';
}

/**
 * Checks if a path is a dynamic asset
 * @param {string} pathname - The pathname to check
 * @returns {boolean} - True if dynamic asset
 */
function isDynamicAsset(pathname) {
	return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Message handling for cache management
self.addEventListener('message', event => {
	const { type, data } = event.data;

	switch (type) {
		case 'SKIP_WAITING':
			self.skipWaiting();
			break;

		case 'CLEAR_CACHE':
			clearAllCaches().then(() => {
				event.ports[0].postMessage({ success: true });
			});
			break;

		case 'CACHE_STATS':
			getCacheStats().then(stats => {
				event.ports[0].postMessage(stats);
			});
			break;
	}
});

/**
 * Clears all caches
 * @returns {Promise<void>}
 */
async function clearAllCaches() {
	const cacheNames = await caches.keys();
	await Promise.all(
		cacheNames.map(cacheName => caches.delete(cacheName))
	);
	console.log('🗑️ All caches cleared');
}

/**
 * Gets cache statistics
 * @returns {Promise<Object>} - Cache stats
 */
async function getCacheStats() {
	const cacheNames = await caches.keys();
	const stats = {};

	for (const cacheName of cacheNames) {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();
		stats[cacheName] = keys.length;
	}

	return stats;
}