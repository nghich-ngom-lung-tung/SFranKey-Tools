"use client";
import { Button } from "@sfrankey/ui";
import { clearPreferences } from "@/lib/storage";
export function ClearLocalData({ label }: { label: string }) { return <Button type="button" variant="danger" onClick={() => { clearPreferences(); window.location.reload(); }}>{label}</Button>; }
