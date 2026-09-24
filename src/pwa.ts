import { registerSW } from 'virtual:pwa-register';

export function setupServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !import.meta.env.DEV) {
    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateSW(true);
        },
        onOfflineReady() {
          // Ready for offline use
        },
      });
    } catch {
      // Graceful fallback
    }
  }
}
