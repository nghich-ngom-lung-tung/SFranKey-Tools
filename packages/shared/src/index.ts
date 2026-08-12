import { z } from "zod";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const localeSchema = z.enum(locales);

export const categories = ["2fa", "password", "qr", "encoding", "developer"] as const;
export type ToolCategory = (typeof categories)[number];
export const categorySchema = z.enum(categories);

export const privacyModes = ["on-device", "network-required"] as const;
export type PrivacyMode = (typeof privacyModes)[number];

export type ToolDefinition = {
  id: string;
  slug: string;
  category: ToolCategory;
  privacyMode: PrivacyMode;
  icon: string;
  keywords: string[];
  featured?: boolean;
  available: boolean;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const feedbackSchema = z.object({
  kind: z.enum(["bug_report", "tool_request"]),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  pageUrl: z.string().url().max(2048).optional().or(z.literal("")),
  locale: localeSchema,
  turnstileToken: z.string().max(4096).optional().default(""),
  website: z.string().max(200).optional().default("")
});
export type FeedbackRequest = z.infer<typeof feedbackSchema>;

export type ApiSuccess<T> = { success: true; data: T; requestId?: string };
export type ApiFailure = { success: false; error: { code: string; message: string; requestId: string } };

export const toolDefinitions: ToolDefinition[] = [
  { id: "totp-generator", slug: "totp-generator", category: "2fa", privacyMode: "on-device", icon: "⌛", keywords: ["totp", "otp", "2fa", "authenticator"], featured: true, available: true, title: { en: "TOTP Generator", vi: "Tạo mã TOTP" }, description: { en: "Generate time-based one-time passwords in your browser.", vi: "Tạo mã OTP theo thời gian trực tiếp trong trình duyệt." } },
  { id: "qr-2fa-scanner", slug: "qr-2fa-scanner", category: "2fa", privacyMode: "on-device", icon: "▣", keywords: ["2fa", "qr", "otpauth"], featured: true, available: true, title: { en: "QR 2FA Scanner", vi: "Quét QR 2FA" }, description: { en: "Read an otpauth QR code locally and inspect its settings.", vi: "Đọc QR otpauth ngay trên thiết bị và xem cấu hình." } },
  { id: "password-generator", slug: "password-generator", category: "password", privacyMode: "on-device", icon: "✦", keywords: ["password", "random", "secure"], featured: true, available: true, title: { en: "Password Generator", vi: "Tạo mật khẩu" }, description: { en: "Create strong random passwords with browser CSPRNG.", vi: "Tạo mật khẩu ngẫu nhiên mạnh bằng CSPRNG của trình duyệt." } },
  { id: "password-strength-checker", slug: "password-strength-checker", category: "password", privacyMode: "on-device", icon: "◈", keywords: ["password", "strength", "entropy"], available: true, title: { en: "Password Strength Checker", vi: "Kiểm tra độ mạnh mật khẩu" }, description: { en: "Check password patterns locally without storing the password.", vi: "Kiểm tra mật khẩu cục bộ mà không lưu lại nội dung." } },
  { id: "qr-generator", slug: "qr-generator", category: "qr", privacyMode: "on-device", icon: "⌗", keywords: ["qr", "barcode", "wifi"], featured: true, available: true, title: { en: "QR Code Generator", vi: "Tạo mã QR" }, description: { en: "Generate QR codes for text, links, Wi-Fi and contact data.", vi: "Tạo mã QR cho văn bản, liên kết, Wi-Fi và thông tin liên hệ." } },
  { id: "qr-reader", slug: "qr-reader", category: "qr", privacyMode: "on-device", icon: "⌕", keywords: ["qr", "scan", "reader", "camera"], available: true, title: { en: "QR Code Reader", vi: "Đọc mã QR" }, description: { en: "Read an image or camera QR code locally before opening anything.", vi: "Đọc QR từ ảnh hoặc camera cục bộ trước khi mở liên kết." } },
  { id: "base64", slug: "base64-encode-decode", category: "encoding", privacyMode: "on-device", icon: "⇄", keywords: ["base64", "encode", "decode", "url-safe"], available: true, title: { en: "Base64 Encode / Decode", vi: "Mã hóa / giải mã Base64" }, description: { en: "Convert UTF-8 text to and from standard or URL-safe Base64.", vi: "Chuyển văn bản UTF-8 sang và từ Base64 thường hoặc URL-safe." } },
  { id: "hash-generator", slug: "hash-generator", category: "encoding", privacyMode: "on-device", icon: "#", keywords: ["hash", "sha256", "checksum"], available: true, title: { en: "Hash Generator", vi: "Tạo hash" }, description: { en: "Create SHA-256, SHA-384 or SHA-512 hashes locally.", vi: "Tạo hash SHA-256, SHA-384 hoặc SHA-512 cục bộ." } },
  { id: "file-checksum", slug: "file-checksum", category: "encoding", privacyMode: "on-device", icon: "◌", keywords: ["checksum", "file", "sha"], available: true, title: { en: "File Checksum", vi: "Checksum file" }, description: { en: "Compare a local file digest with a publisher checksum.", vi: "So sánh digest của file cục bộ với checksum do nhà phát hành cung cấp." } },
  { id: "jwt-decoder", slug: "jwt-decoder", category: "developer", privacyMode: "on-device", icon: "◇", keywords: ["jwt", "json", "token", "decode"], available: true, title: { en: "JWT Decoder", vi: "Giải mã JWT" }, description: { en: "Inspect JWT header and payload without verifying or uploading the token.", vi: "Xem header và payload JWT mà không xác minh hay tải token lên." } },
  { id: "json-formatter", slug: "json-formatter", category: "developer", privacyMode: "on-device", icon: "{}", keywords: ["json", "format", "minify", "validate"], featured: true, available: true, title: { en: "JSON Formatter", vi: "Định dạng JSON" }, description: { en: "Format, minify and validate JSON with useful error locations.", vi: "Định dạng, rút gọn và kiểm tra JSON với vị trí lỗi rõ ràng." } },
  { id: "uuid-generator", slug: "uuid-generator", category: "developer", privacyMode: "on-device", icon: "⊙", keywords: ["uuid", "guid", "random"], available: true, title: { en: "UUID Generator", vi: "Tạo UUID" }, description: { en: "Generate UUID v4 values using browser cryptography.", vi: "Tạo UUID v4 bằng cơ chế ngẫu nhiên an toàn của trình duyệt." } },
  { id: "timestamp-converter", slug: "timestamp-converter", category: "developer", privacyMode: "on-device", icon: "◷", keywords: ["unix", "timestamp", "utc", "date"], available: true, title: { en: "Timestamp Converter", vi: "Chuyển đổi Timestamp" }, description: { en: "Convert Unix seconds or milliseconds to readable time and back.", vi: "Chuyển Unix seconds hoặc milliseconds sang thời gian dễ đọc và ngược lại." } }
];

export const getTool = (slug: string) => toolDefinitions.find((tool) => tool.slug === slug);
