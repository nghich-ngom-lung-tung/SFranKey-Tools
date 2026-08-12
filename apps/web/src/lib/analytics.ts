declare global { interface Window { plausible?: (event: string, options?: { props?: Record<string, string> }) => void } }

export function trackToolUsed(toolId: string) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") window.plausible("tool_used", { props: { toolId } });
}
