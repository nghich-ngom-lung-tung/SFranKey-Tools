"use client";

import * as React from "react";
import { Card, cn, Progress } from "@sfrankey/ui";

export function ResultPanel({ label, status = "idle", mono = false, actions, progress, children }: { label: string; status?: "idle" | "working" | "success" | "warning"; mono?: boolean; actions?: React.ReactNode; progress?: number; children: React.ReactNode }) {
  return <Card variant="result" className={cn("mt-5 transition-[opacity,transform] duration-200", status === "idle" && "opacity-95", mono && "font-mono")}>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-200">{label}</p>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div>
    {progress !== undefined ? <Progress value={progress} className="mt-4" /> : null}
    <div className="mt-4 min-w-0">{children}</div>
  </Card>;
}
