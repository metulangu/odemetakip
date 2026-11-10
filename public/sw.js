// Best Home - Mobile & Desktop Web Notification Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Arka plan Web Push paketlerini dinle (Uygulama kapalıyken bile telefon ekranına düşer)
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: '🔔 Best Home Hatırlatması',
        body: event.data.text() || 'Ödeme veya doğum günü hatırlatmanız var.'
      };
    }
  }

  const title = data.title || '🔔 Best Home Hatırlatması';
  const options = {
    body: data.body || 'Ödeme veya doğum günü hatırlatmanız var.',
    icon: '/icon-192.png',
    badge: '/favicon-32x32.png',
    tag: data.tag || ('besthome-' + Date.now()),
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 400],
    data: {
      url: data.url || '/',
      module: data.module || 'expenses'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (event.notification.data && event.notification.data.module) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              module: event.notification.data.module
            });
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
