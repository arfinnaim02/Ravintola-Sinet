declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
  }
}

export function pushDataLayer(event: string, data: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event,
    ...data,
  });
}