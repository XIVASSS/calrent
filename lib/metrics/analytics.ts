type EventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    calrentAnalytics?: { track: (eventName: string, payload: EventPayload) => void };
  }
}

export function trackEvent(eventName: string, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  if (window.calrentAnalytics) {
    window.calrentAnalytics.track(eventName, payload);
    return;
  }
  // Fallback so events are visible during local development.
  console.info(`[analytics] ${eventName}`, payload);
}
