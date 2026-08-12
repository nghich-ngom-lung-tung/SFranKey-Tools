import QRCode from "qrcode";
import jsQR from "jsqr";

export async function createQrDataUrl(value: string, options?: QRCode.QRCodeToDataURLOptions) { return QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 2, width: 512, ...options }); }
export async function createQrSvg(value: string, options?: QRCode.QRCodeToStringOptions) { return QRCode.toString(value, { type: "svg", errorCorrectionLevel: "M", margin: 2, ...options }); }
export function scanQrImage(image: ImageData) { return jsQR(image.data, image.width, image.height)?.data ?? null; }
