importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// This will be filled by the client with the actual config
let firebaseConfig = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_CONFIG') {
    firebaseConfig = event.data.config;
    firebase.initializeApp(firebaseConfig);
  }
});

// If we already have config from somewhere (e.g. cached), we can init
// Or we wait for the message. For simpler implementation we often hardcode
// but here we can try to initialize if the script is loaded with params or just wait.

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Fallback icon
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get the link from notification data
  const link = event.notification.data?.link;
  
  if (!link) return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window with the same URL is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(link) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
