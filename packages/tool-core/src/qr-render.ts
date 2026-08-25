import QRCode from "qrcode";

export type QrRenderOptions = QRCode.QRCodeToDataURLOptions & {
  logoUrl?: string;
  logoRatio?: number;
  logoPadding?: number;
  logoRadius?: number;
};

export type QrSvgOptions = QRCode.QRCodeToStringOptions & {
  logoUrl?: string;
  logoRatio?: number;
  logoPadding?: number;
  logoRadius?: number;
};

export async function createQrDataUrl(
  value: string,
  options?: QrRenderOptions,
) {
  const {
    logoUrl,
    logoRatio = 0.22,
    logoPadding = 6,
    logoRadius = 14,
    ...qrOptions
  } = options ?? {};

  const errorCorrectionLevel = logoUrl
    ? (qrOptions.errorCorrectionLevel === "L" ? "H" : qrOptions.errorCorrectionLevel ?? "H")
    : (qrOptions.errorCorrectionLevel ?? "M");

  const rawDataUrl = await QRCode.toDataURL(value, {
    margin: 2,
    width: 512,
    ...qrOptions,
    errorCorrectionLevel,
  });

  if (!logoUrl || typeof window === "undefined") {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = qrImg.width;
      canvas.height = qrImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }

      ctx.drawImage(qrImg, 0, 0);

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * logoRatio);
        const boxSize = logoSize + logoPadding * 2;
        const boxX = (canvas.width - boxSize) / 2;
        const boxY = (canvas.height - boxSize) / 2;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;

        const lightBg = (qrOptions.color?.light as string) || "#ffffff";

        // Draw shadow container box
        ctx.save();
        ctx.fillStyle = lightBg;
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(boxX, boxY, boxSize, boxSize, logoRadius + 2);
        } else {
          ctx.rect(boxX, boxY, boxSize, boxSize);
        }
        ctx.fill();
        ctx.restore();

        // Draw border
        ctx.save();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(boxX, boxY, boxSize, boxSize, logoRadius + 2);
        } else {
          ctx.rect(boxX, boxY, boxSize, boxSize);
        }
        ctx.stroke();
        ctx.restore();

        // Draw logo with clipping
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(logoX, logoY, logoSize, logoSize, logoRadius);
        } else {
          ctx.rect(logoX, logoY, logoSize, logoSize);
        }
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        resolve(canvas.toDataURL("image/png"));
      };

      logoImg.onerror = () => {
        resolve(rawDataUrl);
      };
      logoImg.src = logoUrl;
    };

    qrImg.onerror = () => {
      resolve(rawDataUrl);
    };
    qrImg.src = rawDataUrl;
  });
}

export async function createQrSvg(
  value: string,
  options?: QrSvgOptions,
) {
  const {
    logoUrl,
    logoRatio = 0.22,
    logoPadding = 6,
    logoRadius = 14,
    ...qrOptions
  } = options ?? {};

  const errorCorrectionLevel = logoUrl
    ? (qrOptions.errorCorrectionLevel === "L" ? "H" : qrOptions.errorCorrectionLevel ?? "H")
    : (qrOptions.errorCorrectionLevel ?? "M");

  const svgString = await QRCode.toString(value, {
    type: "svg",
    margin: 2,
    ...qrOptions,
    errorCorrectionLevel,
  });

  if (!logoUrl) return svgString;

  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) return svgString;

  const [, , vbWidthStr, vbHeightStr] = viewBoxMatch[1].split(/\s+/).map(Number);
  const width = vbWidthStr || 512;
  const height = vbHeightStr || 512;
  const logoSize = width * logoRatio;
  const boxSize = logoSize + logoPadding * 2;
  const boxX = (width - boxSize) / 2;
  const boxY = (height - boxSize) / 2;
  const logoX = (width - logoSize) / 2;
  const logoY = (height - logoSize) / 2;
  const lightBg = (qrOptions.color?.light as string) || "#ffffff";

  const logoOverlay = `
  <g class="qr-center-logo">
    <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="${logoRadius + 2}" ry="${logoRadius + 2}" fill="${lightBg}" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" />
    <image href="${logoUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#qr-logo-clip)" />
    <defs>
      <clipPath id="qr-logo-clip">
        <rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${logoRadius}" ry="${logoRadius}" />
      </clipPath>
    </defs>
  </g>
</svg>`;

  return svgString.replace(/<\/svg>\s*$/, logoOverlay);
}
