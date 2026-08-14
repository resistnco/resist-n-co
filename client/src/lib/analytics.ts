/**
 * Pixel Meta (Facebook) — chargement conditionnel.
 *
 * Le pixel ne se charge QUE si la variable d'environnement VITE_FB_PIXEL_ID
 * est définie au moment du build. Aucun ID n'est codé en dur.
 *
 * Pour l'activer : créer le pixel dans Meta Events Manager, puis définir
 * VITE_FB_PIXEL_ID=<id numérique> dans les variables d'environnement Render.
 */

const PIXEL_ID: string | undefined = import.meta.env.VITE_FB_PIXEL_ID;

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { queue?: any[]; callMethod?: any };
    _fbq?: any;
  }
}

let initialized = false;

/** Charge le script du pixel une seule fois. Sans ID, ne fait rien. */
export function initPixel(): void {
  if (initialized || !PIXEL_ID || typeof window === "undefined") return;
  initialized = true;

  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq?.("init", PIXEL_ID);
  window.fbq?.("track", "PageView");
}

/** Vrai si un pixel est configuré et chargé. */
export function isPixelEnabled(): boolean {
  return Boolean(PIXEL_ID) && initialized;
}

function track(event: string, params?: Record<string, unknown>): void {
  if (!isPixelEnabled()) return;
  window.fbq?.("track", event, params);
}

/* -------------------------------------------------------------------------- */
/* Événements standard e-commerce                                             */
/* -------------------------------------------------------------------------- */

export function trackPageView(): void {
  track("PageView");
}

export function trackViewContent(p: {
  id: string;
  name: string;
  price: number;
}): void {
  track("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    value: p.price,
    currency: "CAD",
  });
}

export function trackAddToCart(p: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}): void {
  track("AddToCart", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    value: p.price * p.quantity,
    currency: "CAD",
  });
}

export function trackInitiateCheckout(p: {
  ids: string[];
  value: number;
  numItems: number;
}): void {
  track("InitiateCheckout", {
    content_ids: p.ids,
    content_type: "product",
    value: p.value,
    currency: "CAD",
    num_items: p.numItems,
  });
}

export function trackPurchase(p: {
  orderNumber: string;
  value: number;
  ids?: string[];
}): void {
  track("Purchase", {
    content_ids: p.ids ?? [],
    content_type: "product",
    value: p.value,
    currency: "CAD",
    order_id: p.orderNumber,
  });
}

export function trackSearch(query: string): void {
  track("Search", { search_string: query });
}

export function trackContact(): void {
  track("Contact");
}
