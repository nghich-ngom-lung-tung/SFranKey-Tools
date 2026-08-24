let scriptPromise: Promise<void> | null = null;

function loadTurnstile() {
  if (typeof window === "undefined" || window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const onError = () => {
      scriptPromise = null;
      reject(new Error("TURNSTILE_FAILED"));
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile/"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function executeTurnstile(): Promise<string> {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!sitekey) return "";
  await loadTurnstile();
  if (!window.turnstile) throw new Error("TURNSTILE_FAILED");
  const host = document.createElement("div");
  host.className = "fixed bottom-4 right-4 z-[120]";
  document.body.appendChild(host);
  return await new Promise<string>((resolve, reject) => {
    let widgetId = "";
    const cleanup = () => { if (widgetId && window.turnstile) window.turnstile.remove(widgetId); host.remove(); };
    widgetId = window.turnstile!.render(host, {
      sitekey, execution: "execute", appearance: "interaction-only",
      callback: (token) => { cleanup(); resolve(token); },
      "expired-callback": () => { cleanup(); reject(new Error("TURNSTILE_FAILED")); },
      "error-callback": () => { cleanup(); reject(new Error("TURNSTILE_FAILED")); }
    });
    window.turnstile!.execute(widgetId);
  });
}
