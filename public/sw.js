// Service Worker for Push Notifications
// Place this file in the public folder

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const options = {
            body: data.body || 'New alert from ZenithScores',
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/',
                dateOfArrival: Date.now(),
            },
            actions: [
                { action: 'view', title: 'View Details' },
                { action: 'dismiss', title: 'Dismiss' },
            ],
            tag: data.tag || 'zenith-alert',
            renotify: true,
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'ZenithScores Alert', options)
        );
    } catch (err) {
        console.error('[SW] Push parse error:', err);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/signals';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes('zenithscores') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Handle background sync for offline alerts
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-alerts') {
        event.waitUntil(syncAlerts());
    }
});

async function syncAlerts() {
    // Placeholder for offline sync logic
    console.log('[SW] Syncing alerts...');
}

// Cache static assets
const CACHE_NAME = 'zenith-v1';
const STATIC_ASSETS = [
    '/favicon.ico',
    '/icon-192.png',
    '/badge-72.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
