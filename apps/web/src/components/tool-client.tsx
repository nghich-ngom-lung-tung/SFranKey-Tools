"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Locale } from "@sfrankey/shared";
import { trackToolUsed } from "@/lib/analytics";
import { recordRecentTool } from "@/lib/storage";
import { TwoFactorWorkspace } from "@/components/two-factor-workspace";
import { PasswordCheckerTool, PasswordGeneratorTool } from "@/components/password-workspace";

const QrGeneratorWorkspace = dynamic(() => import("@/components/qr-generator-workspace").then((module) => module.QrGeneratorWorkspace), { ssr: false });
const QrReaderWorkspace = dynamic(() => import("@/components/qr-reader-workspace").then((module) => module.QrReaderWorkspace), { ssr: false });
const Base64Workspace = dynamic(() => import("@/components/base64-workspace").then((module) => module.Base64Workspace), { ssr: false });
const HashWorkspace = dynamic(() => import("@/components/hash-workspace").then((module) => module.HashWorkspace), { ssr: false });
const FileChecksumWorkspace = dynamic(() => import("@/components/file-checksum-workspace").then((module) => module.FileChecksumWorkspace), { ssr: false });
const JwtDecoderWorkspace = dynamic(() => import("@/components/jwt-decoder-workspace").then((module) => module.JwtDecoderWorkspace), { ssr: false });
const JsonFormatterWorkspace = dynamic(() => import("@/components/json-formatter-workspace").then((module) => module.JsonFormatterWorkspace), { ssr: false });
const UuidGeneratorWorkspace = dynamic(() => import("@/components/uuid-generator-workspace").then((module) => module.UuidGeneratorWorkspace), { ssr: false });
const TimestampConverterWorkspace = dynamic(() => import("@/components/timestamp-converter-workspace").then((module) => module.TimestampConverterWorkspace), { ssr: false });
const NetworkWorkspace = dynamic(() => import("@/components/network-workspace").then((module) => module.NetworkWorkspace), { ssr: false });

export function ToolClient({ locale, slug }: { locale: Locale; slug: string }) {
  React.useEffect(() => {
    if (slug !== "password-strength-checker") trackToolUsed(slug);
    recordRecentTool(slug);
  }, [slug]);

  switch (slug) {
    case "totp-generator": return <TwoFactorWorkspace locale={locale} initialTab="secret" />;
    case "qr-2fa-scanner": return <TwoFactorWorkspace locale={locale} initialTab="scan" />;
    case "password-generator": return <PasswordGeneratorTool locale={locale} />;
    case "password-strength-checker": return <PasswordCheckerTool locale={locale} />;
    case "qr-generator": return <QrGeneratorWorkspace locale={locale} />;
    case "qr-reader": return <QrReaderWorkspace locale={locale} />;
    case "base64-encode-decode": return <Base64Workspace locale={locale} />;
    case "hash-generator": return <HashWorkspace locale={locale} />;
    case "file-checksum": return <FileChecksumWorkspace locale={locale} />;
    case "jwt-decoder": return <JwtDecoderWorkspace locale={locale} />;
    case "json-formatter": return <JsonFormatterWorkspace locale={locale} />;
    case "uuid-generator": return <UuidGeneratorWorkspace locale={locale} />;
    case "timestamp-converter": return <TimestampConverterWorkspace locale={locale} />;
    case "check-my-ip": case "ip-lookup": case "vpn-proxy-checker": case "ip-leak-test": case "dns-leak-test": case "webrtc-leak-test": case "dns-lookup": case "ssl-checker": case "redirect-checker": case "http-header-checker": return <NetworkWorkspace locale={locale} slug={slug} />;
    default: return null;
  }
}
