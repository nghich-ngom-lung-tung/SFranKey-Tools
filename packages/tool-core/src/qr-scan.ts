import jsQR from "jsqr";

export function scanQrImage(image: ImageData) {
  return jsQR(image.data, image.width, image.height)?.data ?? null;
}
