export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      if ("sync" in registration) {
        await registration.sync.register("replay-failed-requests");
      }
    } catch (err) {
      console.warn("[PWA] Service worker registration failed:", err);
    }
  });
}
