export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker] Registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Registration failed:', error);
        });
    });
  } else if ('serviceWorker' in navigator) {
    // Register in dev mode too for testing offline features
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker Dev] Registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[ServiceWorker Dev] Registration failed:', error);
        });
    });
  }
}
