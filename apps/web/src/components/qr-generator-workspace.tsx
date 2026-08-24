"use client";

import * as React from "react";
import {
  buildQrPayload,
  validateQrColors,
  type QrErrorCode,
  type QrPayload,
  type QrValidationError,
} from "@sfrankey/tool-core/qr";
import { createQrDataUrl, createQrSvg } from "@sfrankey/tool-core/qr-render";
import type { Locale } from "@sfrankey/shared";
import {
  Button,
  Card,
  Checkbox,
  CopyButton,
  Input,
  Label,
  Select,
  Textarea,
} from "@sfrankey/ui";
import { getDictionary } from "@sfrankey/i18n";
import { downloadBlob } from "@/lib/download";
import { ResultPanel } from "@/components/result-panel";

type Kind = QrPayload["kind"];
type GeneratedRender = {
  foreground: string;
  background: string;
  errorCorrection: "L" | "M" | "Q" | "H";
};
const MAX_BYTES = 2_953;

export function QrGeneratorWorkspace({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).qrSuite.generator;
  const shared = getDictionary(locale).qrSuite.shared;
  const [kind, setKind] = React.useState<Kind>("text");
  const [text, setText] = React.useState("SFranKey");
  const [url, setUrl] = React.useState("https://sfrankey.com");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [ssid, setSsid] = React.useState("");
  const [security, setSecurity] = React.useState<"WPA" | "WEP" | "nopass">(
    "WPA",
  );
  const [wifiPassword, setWifiPassword] = React.useState("");
  const [hidden, setHidden] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [vcardEmail, setVcardEmail] = React.useState("");
  const [vcardPhone, setVcardPhone] = React.useState("");
  const [vcardUrl, setVcardUrl] = React.useState("");
  const [size, setSize] = React.useState<256 | 512 | 1024>(512);
  const [errorCorrection, setErrorCorrection] = React.useState<
    "L" | "M" | "Q" | "H"
  >("M");
  const [foreground, setForeground] = React.useState("#063b2b");
  const [background, setBackground] = React.useState("#ffffff");
  const [dataUrl, setDataUrl] = React.useState("");
  const [payload, setPayload] = React.useState("");
  const [error, setError] = React.useState("");
  const [generatedSignature, setGeneratedSignature] = React.useState("");
  const [generatedRender, setGeneratedRender] =
    React.useState<GeneratedRender | null>(null);
  const generationRef = React.useRef(0);
  const makePayload = React.useCallback((): QrPayload => {
    if (kind === "text") return { kind, text };
    if (kind === "url") return { kind, url };
    if (kind === "email") return { kind, email, subject, body };
    if (kind === "phone") return { kind, phone };
    if (kind === "sms") return { kind, phone, message };
    if (kind === "wifi")
      return { kind, ssid, security, password: wifiPassword, hidden };
    return {
      kind: "vcard",
      fullName,
      organization,
      title: jobTitle,
      phone: vcardPhone,
      email: vcardEmail,
      url: vcardUrl,
    };
  }, [
    body,
    email,
    fullName,
    kind,
    message,
    organization,
    phone,
    security,
    ssid,
    subject,
    text,
    url,
    vcardEmail,
    vcardPhone,
    vcardUrl,
    wifiPassword,
    hidden,
    jobTitle,
  ]);

  const formSignature = React.useMemo(
    () =>
      JSON.stringify({
        payload: makePayload(),
        size,
        errorCorrection,
        foreground,
        background,
      }),
    [background, errorCorrection, foreground, makePayload, size],
  );
  const stale = Boolean(dataUrl && formSignature !== generatedSignature);
  React.useEffect(
    () => () => {
      generationRef.current += 1;
    },
    [],
  );

  const generate = React.useCallback(async () => {
    const generationId = ++generationRef.current;
    try {
      const colors = validateQrColors(foreground, background);
      if (!colors.usable) throw new Error("LOW_CONTRAST");
      const nextPayload = makePayload();
      const nextValue = buildQrPayload(nextPayload);
      if (new TextEncoder().encode(nextValue).byteLength > MAX_BYTES)
        throw new Error("PAYLOAD_TOO_LARGE");
      const nextDataUrl = await createQrDataUrl(nextValue, {
        width: size,
        errorCorrectionLevel: errorCorrection,
        margin: 2,
        color: { dark: foreground, light: background },
      });
      if (generationId !== generationRef.current) return;
      setPayload(nextValue);
      setDataUrl(nextDataUrl);
      setGeneratedSignature(formSignature);
      setGeneratedRender({ foreground, background, errorCorrection });
      setError(colors.warning ? "WARNING_CONTRAST" : "");
    } catch (caught) {
      if (generationId !== generationRef.current) return;
      const code = caught instanceof Error ? caught.message : "INVALID";
      const qrError = caught as Partial<QrValidationError>;
      const validationCode = (qrError.code ?? code) as QrErrorCode;
      const validationMessages: Partial<Record<QrErrorCode, string>> = {
        EMPTY_FIELD: t.errors.required,
        INVALID_URL: t.errors.url,
        INVALID_EMAIL: t.errors.email,
        INVALID_PHONE: t.errors.phone,
        MISSING_PASSWORD: t.errors.password,
        INVALID_COLOR: t.errors.invalid,
      };
      setError(
        validationCode === "PAYLOAD_TOO_LARGE"
          ? t.payloadTooLarge
          : validationCode === "LOW_CONTRAST"
            ? t.contrastError
            : (validationMessages[validationCode] ?? t.errors.invalid),
      );
    }
  }, [
    background,
    errorCorrection,
    foreground,
    formSignature,
    makePayload,
    size,
    t,
  ]);

  const reset = () => {
    generationRef.current += 1;
    setKind("text");
    setText("SFranKey");
    setUrl("https://sfrankey.com");
    setEmail("");
    setSubject("");
    setBody("");
    setPhone("");
    setMessage("");
    setSsid("");
    setSecurity("WPA");
    setWifiPassword("");
    setHidden(false);
    setFullName("");
    setOrganization("");
    setJobTitle("");
    setVcardEmail("");
    setVcardPhone("");
    setVcardUrl("");
    setSize(512);
    setErrorCorrection("M");
    setForeground("#063b2b");
    setBackground("#ffffff");
    setDataUrl("");
    setPayload("");
    setError("");
    setGeneratedSignature("");
    setGeneratedRender(null);
  };

  const errorMessage = error === "WARNING_CONTRAST" ? t.contrastWarning : error;
  return (
    <Card
      variant="workspace"
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="qr-kind">{t.payloadTypeLabel}</Label>
            <Select
              id="qr-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as Kind)}
            >
              <option value="text">{shared.text}</option>
              <option value="url">{shared.url}</option>
              <option value="email">{shared.email}</option>
              <option value="phone">{shared.phone}</option>
              <option value="sms">{shared.sms}</option>
              <option value="wifi">{shared.wifi}</option>
              <option value="vcard">{shared.vcard}</option>
            </Select>
          </div>
          {kind === "text" ? (
            <div>
              <Label htmlFor="qr-text">{t.textLabel}</Label>
              <Textarea
                id="qr-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
          ) : null}
          {kind === "url" ? (
            <div>
              <Label htmlFor="qr-url">{t.urlLabel}</Label>
              <Input
                id="qr-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>
          ) : null}
          {kind === "email" ? (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="qr-email">{t.emailLabel}</Label>
                <Input
                  id="qr-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-subject">{t.subjectLabel}</Label>
                <Input
                  id="qr-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-body">{t.bodyLabel}</Label>
                <Textarea
                  id="qr-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          {kind === "phone" || kind === "sms" ? (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="qr-phone">{t.phoneLabel}</Label>
                <Input
                  id="qr-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              {kind === "sms" ? (
                <div>
                  <Label htmlFor="qr-message">{t.smsMessageLabel}</Label>
                  <Textarea
                    id="qr-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          {kind === "wifi" ? (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="qr-ssid">{t.ssidLabel}</Label>
                <Input
                  id="qr-ssid"
                  value={ssid}
                  onChange={(event) => setSsid(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-security">{t.securityLabel}</Label>
                <Select
                  id="qr-security"
                  value={security}
                  onChange={(event) =>
                    setSecurity(event.target.value as typeof security)
                  }
                >
                  <option value="WPA">WPA</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{t.noPassword}</option>
                </Select>
              </div>
              {security !== "nopass" ? (
                <div>
                  <Label htmlFor="qr-wifi-password">{t.passwordLabel}</Label>
                  <Input
                    id="qr-wifi-password"
                    type="password"
                    value={wifiPassword}
                    onChange={(event) => setWifiPassword(event.target.value)}
                  />
                </div>
              ) : null}
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <Checkbox
                  checked={hidden}
                  onCheckedChange={(value) => setHidden(value === true)}
                />
                {t.hiddenLabel}
              </label>
            </div>
          ) : null}
          {kind === "vcard" ? (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="qr-full-name">{t.fullNameLabel}</Label>
                <Input
                  id="qr-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-org">{t.organizationLabel}</Label>
                <Input
                  id="qr-org"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-title">{t.jobTitleLabel}</Label>
                <Input
                  id="qr-title"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-vcard-phone">{t.vcardPhoneLabel}</Label>
                <Input
                  id="qr-vcard-phone"
                  value={vcardPhone}
                  onChange={(event) => setVcardPhone(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-vcard-email">{t.vcardEmailLabel}</Label>
                <Input
                  id="qr-vcard-email"
                  value={vcardEmail}
                  onChange={(event) => setVcardEmail(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qr-vcard-url">{t.vcardUrlLabel}</Label>
                <Input
                  id="qr-vcard-url"
                  value={vcardUrl}
                  onChange={(event) => setVcardUrl(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="qr-size">{t.sizeLabel}</Label>
              <Select
                id="qr-size"
                value={size}
                onChange={(event) =>
                  setSize(Number(event.target.value) as typeof size)
                }
              >
                <option value="256">256px</option>
                <option value="512">512px</option>
                <option value="1024">1024px</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="qr-correction">{t.correctionLabel}</Label>
              <Select
                id="qr-correction"
                value={errorCorrection}
                onChange={(event) =>
                  setErrorCorrection(
                    event.target.value as typeof errorCorrection,
                  )
                }
              >
                <option>L</option>
                <option>M</option>
                <option>Q</option>
                <option>H</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="qr-foreground">{t.foregroundLabel}</Label>
              <Input
                id="qr-foreground"
                type="color"
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
                className="h-11 p-1"
              />
            </div>
            <div>
              <Label htmlFor="qr-background">{t.backgroundLabel}</Label>
              <Input
                id="qr-background"
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                className="h-11 p-1"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void generate()}>
              {t.generate}
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              {t.reset}
            </Button>
          </div>
          {errorMessage ? (
            <p
              role={error === "WARNING_CONTRAST" ? "status" : "alert"}
              className={
                error === "WARNING_CONTRAST"
                  ? "text-sm text-amber-700 dark:text-amber-300"
                  : "text-sm text-rose-600 dark:text-rose-300"
              }
            >
              {errorMessage}
            </p>
          ) : null}
        </section>
        <section>
          <ResultPanel
            label={t.preview}
            status={dataUrl ? "success" : "idle"}
            actions={
              dataUrl ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={stale}
                    onClick={() =>
                      downloadBlob({
                        blob: dataUrlToBlob(dataUrl),
                        fileName: `sfrankey-qr-${kind}.png`,
                      })
                    }
                  >
                    {t.downloadPng}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={stale}
                    onClick={async () => {
                      if (!generatedRender) return;
                      const svg = await createQrSvg(payload, {
                        errorCorrectionLevel: generatedRender.errorCorrection,
                        margin: 2,
                        color: {
                          dark: generatedRender.foreground,
                          light: generatedRender.background,
                        },
                      });
                      downloadBlob({
                        blob: new Blob([svg], { type: "image/svg+xml" }),
                        fileName: `sfrankey-qr-${kind}.svg`,
                      });
                    }}
                  >
                    {t.downloadSvg}
                  </Button>
                </>
              ) : undefined
            }
          >
            {dataUrl ? (
              <div className="grid justify-items-center gap-4">
                <img
                  src={dataUrl}
                  alt={t.preview}
                  className="size-full max-w-[min(100%,24rem)] rounded-2xl border border-brand-200 bg-white p-4 shadow-soft"
                />
                {payload ? (
                  <CopyButton value={payload} label={shared.copy} />
                ) : null}
                <p className="break-all text-center text-xs text-brand-800/65 dark:text-brand-200/65">
                  {new TextEncoder().encode(payload).byteLength} / {MAX_BYTES}{" "}
                  {t.bytes}
                </p>
                {stale ? (
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t.updateRequired}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-brand-800/65 dark:text-brand-200/65">
                {t.noResult}
              </p>
            )}
          </ResultPanel>
        </section>
      </div>
      <p className="mt-5 text-xs text-brand-800/65 dark:text-brand-200/65">
        {t.privacy}
      </p>
    </Card>
  );
}

function dataUrlToBlob(value: string) {
  const [header, encoded] = value.split(",");
  const binary = atob(encoded);
  return new Blob(
    [Uint8Array.from(binary, (character) => character.charCodeAt(0))],
    { type: header.match(/^data:([^;]+)/)?.[1] ?? "image/png" },
  );
}
