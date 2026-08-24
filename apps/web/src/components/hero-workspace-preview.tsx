import { BrandMark } from "@sfrankey/ui";

export type HeroWorkspacePreviewCopy = {
  terminalLabel: string;
  localLabel: string;
  mode: string;
  status: string;
  overview: string;
  privacy: string;
  output: string;
  signal: string;
  input: string;
  memory: string;
  result: string;
  noUpload: string;
  noAccount: string;
  memoryOnly: string;
};

type HeroWorkspacePreviewProps = {
  copy: HeroWorkspacePreviewCopy;
  headline: string;
  body: string;
};

const railItems = ["overview", "privacy", "output"] as const;

/**
 * Decorative homepage artwork only. Real input and output never enter this
 * component; the actual tool workspaces own all sensitive state.
 */
export function HeroWorkspacePreview({ copy, headline, body }: HeroWorkspacePreviewProps) {
  const railLabels = { overview: copy.overview, privacy: copy.privacy, output: copy.output };

  return <div className="hero-terminal group relative overflow-hidden rounded-[var(--radius-2xl)]" aria-hidden="true">
    <div className="hero-terminal-grid pointer-events-none absolute inset-0" />
    <div className="hero-terminal-orb hero-terminal-orb-one pointer-events-none absolute -right-16 -top-20 size-56 rounded-full" />
    <div className="hero-terminal-orb hero-terminal-orb-two pointer-events-none absolute -bottom-24 -left-12 size-48 rounded-full" />

    <div className="relative">
      <div className="flex min-h-14 items-center gap-2 border-b border-[var(--terminal-border)] px-4 sm:px-5">
        <span className="size-2.5 rounded-full bg-rose-300 shadow-[0_0_14px_rgba(251,113,133,.45)]" />
        <span className="size-2.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.4)]" />
        <span className="size-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.45)]" />
        <span className="ml-2 min-w-0 truncate text-[10px] font-bold uppercase tracking-[.2em] text-[var(--terminal-muted)]">{copy.terminalLabel}</span>
        <span className="hero-terminal-local ml-auto hidden items-center gap-2 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em] sm:inline-flex"><span className="size-1.5 rounded-full bg-brand-300 shadow-[0_0_10px_rgba(120,217,165,.8)]" />{copy.localLabel}</span>
      </div>

      <div className="grid sm:grid-cols-[8.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--terminal-border)] p-3 sm:block">
          <div className="mb-5 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--terminal-muted)]"><BrandMark className="hero-terminal-logo size-5" /> SF</div>
          <nav className="grid gap-1">
            {railItems.map((item, index) => <div key={item} className={index === 0 ? "hero-terminal-rail-item hero-terminal-rail-item-active" : "hero-terminal-rail-item"}><span className="hero-terminal-rail-icon">{index === 0 ? "✦" : index === 1 ? "◌" : "↗"}</span><span>{railLabels[item]}</span></div>)}
          </nav>
          <div className="hero-terminal-side-note mt-8"><span className="hero-terminal-accent-text block text-[9px] font-bold uppercase tracking-[.16em]">{copy.mode}</span><span className="mt-3 flex items-center gap-1.5"><i className="h-1.5 flex-1 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(120,217,165,.8)]" /><i className="h-1.5 w-3 rounded-full bg-black/10 dark:bg-white/15" /></span></div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="hero-terminal-mark grid size-11 shrink-0 place-items-center rounded-2xl"><BrandMark className="hero-terminal-logo size-7" /></span>
            <div className="min-w-0 flex-1"><p className="hero-terminal-accent-text text-[10px] font-bold uppercase tracking-[.2em]">{copy.mode}</p><p className="mt-1 line-clamp-2 text-lg font-black leading-6 tracking-[-.02em] text-[var(--terminal-ink)] sm:text-xl">{headline}</p></div>
            <span className="hero-terminal-status hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] sm:inline-flex"><span className="size-1.5 rounded-full bg-emerald-400" />{copy.status}</span>
          </div>

          <div className="hero-terminal-summary mt-5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><p className="hero-terminal-accent-text text-[10px] font-bold uppercase tracking-[.18em]">{copy.privacy}</p><span className="hero-terminal-summary-check">✓</span></div>
            <p className="mt-3 text-base font-bold leading-6 text-[var(--terminal-ink)] sm:text-lg">{body}</p>
            <div className="mt-5 grid grid-cols-3 gap-2"><SummaryPill label={copy.noUpload} tone="mint" /><SummaryPill label={copy.noAccount} tone="cyan" /><SummaryPill label={copy.memoryOnly} tone="violet" /></div>
          </div>

          <div className="hero-terminal-flow mt-4 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--terminal-muted)]">{copy.signal}</p><span className="hero-terminal-accent-text flex items-center gap-1.5 text-[10px] font-bold"><i className="size-1.5 rounded-full bg-brand-300" />{copy.status}</span></div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 sm:gap-2"><FlowCard label={copy.input} tone="mint" /><FlowArrow /><FlowCard label={copy.memory} tone="cyan" /><FlowArrow /><FlowCard label={copy.result} tone="violet" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

function SummaryPill({ label, tone }: { label: string; tone: "mint" | "cyan" | "violet" }) {
  return <span className={`hero-terminal-pill hero-terminal-pill-${tone}`}><i />{label}</span>;
}

function FlowCard({ label, tone }: { label: string; tone: "mint" | "cyan" | "violet" }) {
  return <div className={`hero-terminal-flow-card hero-terminal-flow-card-${tone}`}><span className="hero-terminal-flow-dot" /><span>{label}</span></div>;
}

function FlowArrow() {
  return <span className="hero-terminal-flow-arrow" aria-hidden="true">→</span>;
}
