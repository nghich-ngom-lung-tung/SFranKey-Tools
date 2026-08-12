import { notFound } from "next/navigation";
import { locales, type Locale } from "@sfrankey/shared";
export function assertLocale(value: string): Locale { if (!locales.includes(value as Locale)) notFound(); return value as Locale; }
export function localePath(locale: Locale, path = "") { return `/${locale}${path ? `/${path.replace(/^\//, "")}` : ""}`; }
