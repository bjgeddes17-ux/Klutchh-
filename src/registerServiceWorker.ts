export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // In dev, preview, or cloud containers, aggressively unregister any service workers to prevent hook caching conflicts
    if (
      process.env.NODE_ENV !== 'production' ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('webcontainer') ||
      window.location.hostname.includes('googleusercontent')
    ) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker] Registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Registration note:', error);
        });
    });
  }
}

