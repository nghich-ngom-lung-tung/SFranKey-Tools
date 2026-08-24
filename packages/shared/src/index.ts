import { z } from "zod";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const localeSchema = z.enum(locales);

export const categories = ["2fa", "password", "qr", "encoding", "developer", "network"] as const;
export type ToolCategory = (typeof categories)[number];
export const categorySchema = z.enum(categories);

export const privacyModes = ["on-device", "network-required"] as const;
export type PrivacyMode = (typeof privacyModes)[number];

export type ToolIconKey =
  | "timer"
  | "scan-line"
  | "key-round"
  | "shield-check"
  | "qr-code"
  | "scan-qr-code"
  | "binary"
  | "hash"
  | "file-check"
  | "braces"
  | "code-xml"
  | "fingerprint"
  | "clock-3"
  | "globe-2"
  | "map-pin"
  | "shield-question"
  | "radar"
  | "server-cog"
  | "radio-tower"
  | "network"
  | "lock-keyhole"
  | "route"
  | "panel-top";

export const detectionStates = ["detected", "not-detected", "unknown"] as const;
export type DetectionState = (typeof detectionStates)[number];
export type IpVersion = 4 | 6;
export const ipScopes = ["public", "private", "loopback", "link-local", "carrier-grade-nat", "multicast", "documentation", "reserved", "unspecified"] as const;
export type IpScope = (typeof ipScopes)[number];

export type ProviderCapabilities = {
  country: boolean;
  city: boolean;
  asn: boolean;
  networkType: boolean;
  privacy: boolean;
  residentialProxy: boolean;
};

export type IpProfile = {
  ip: string;
  version: IpVersion;
  scope: IpScope;
  countryCode?: string;
  countryName?: string;
  region?: string;
  city?: string;
  timezone?: string;
  approximate: true;
  asn?: { number: string; name?: string; domain?: string; type?: string };
  reverseDns?: string;
  network?: { type?: string; anycast: DetectionState; mobile: DetectionState; hosting: DetectionState };
  capabilities: ProviderCapabilities;
};

export type PrivacyAssessment = {
  vpn: DetectionState;
  proxy: DetectionState;
  tor: DetectionState;
  relay: DetectionState;
  hosting: DetectionState;
  residentialProxy: DetectionState;
  mobile: DetectionState;
  providerName?: string;
};

export const dnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA"] as const;
export type DnsRecordType = (typeof dnsRecordTypes)[number];
export type DnsRecord = { type: DnsRecordType; name: string; ttl: number; value: string; priority?: number; flags?: number; tag?: string };
export type DnsLookupResult = { hostname: string; status: "NOERROR" | "NXDOMAIN" | "ERROR"; authenticatedData: boolean; records: DnsRecord[] };

export type RedirectHop = { index: number; url: string; status: number; location?: string; durationMs: number; protocol: "http:" | "https:" };
export type HeaderAssessmentStatus = "present" | "missing" | "warning" | "informational";
export type HeaderAssessment = { name: string; value?: string; status: HeaderAssessmentStatus; explanation: string };
export type NetworkCapabilities = { ipInfoBasic: boolean; privacyDetection: boolean; ipv4Endpoint: boolean; ipv6Endpoint: boolean; dnsLookup: boolean; dnsLeakProbe: boolean; webRtcStun: boolean; tlsProbe: boolean; httpProbe: boolean };

export type NetworkErrorCode =
  | "NETWORK_TOOLS_DISABLED" | "TURNSTILE_REQUIRED" | "TURNSTILE_FAILED" | "INVALID_IP" | "NON_PUBLIC_IP"
  | "INVALID_HOSTNAME" | "INVALID_URL" | "UNSUPPORTED_PROTOCOL" | "UNSUPPORTED_PORT" | "UNSAFE_TARGET"
  | "DNS_LOOKUP_FAILED" | "DNS_NXDOMAIN" | "PROVIDER_UNAVAILABLE" | "CAPABILITY_UNAVAILABLE" | "REQUEST_TIMEOUT"
  | "TLS_HANDSHAKE_FAILED" | "REDIRECT_LOOP" | "TOO_MANY_REDIRECTS" | "PROBE_UNAVAILABLE" | "SESSION_EXPIRED"
  | "RATE_LIMITED" | "PROCESSING_FAILED";

export const networkActionSchema = z.object({ turnstileToken: z.string().max(4096).default("") });
export const ipLookupSchema = networkActionSchema.extend({ ip: z.string().trim().min(2).max(64) });
export const privacyCheckSchema = networkActionSchema.extend({ ip: z.string().trim().max(64).optional() });
export const dnsLookupSchema = networkActionSchema.extend({ hostname: z.string().trim().min(1).max(253), types: z.array(z.enum(dnsRecordTypes)).min(1).max(dnsRecordTypes.length) });
export const hostnameCheckSchema = networkActionSchema.extend({ hostname: z.string().trim().min(1).max(253) });
export const urlCheckSchema = networkActionSchema.extend({ url: z.string().trim().min(1).max(2048) });
export const leakSessionSchema = networkActionSchema.extend({ kind: z.enum(["dns", "combined"]) });

export type ToolDefinition = {
  id: string;
  slug: string;
  category: ToolCategory;
  privacyMode: PrivacyMode;
  iconKey: ToolIconKey;
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
  { id: "totp-generator", slug: "totp-generator", category: "2fa", privacyMode: "on-device", iconKey: "timer", keywords: ["totp", "otp", "2fa", "authenticator"], featured: true, available: true, title: { en: "TOTP Generator", vi: "Tạo mã TOTP" }, description: { en: "Generate time-based one-time passwords in your browser.", vi: "Tạo mã OTP theo thời gian trực tiếp trong trình duyệt." } },
  { id: "qr-2fa-scanner", slug: "qr-2fa-scanner", category: "2fa", privacyMode: "on-device", iconKey: "scan-line", keywords: ["2fa", "qr", "otpauth"], featured: true, available: true, title: { en: "QR 2FA Scanner", vi: "Quét QR 2FA" }, description: { en: "Read an otpauth QR code locally and inspect its settings.", vi: "Đọc QR otpauth ngay trên thiết bị và xem cấu hình." } },
  { id: "password-generator", slug: "password-generator", category: "password", privacyMode: "on-device", iconKey: "key-round", keywords: ["password", "random", "secure"], featured: true, available: true, title: { en: "Password Generator", vi: "Tạo mật khẩu" }, description: { en: "Create strong random passwords with browser CSPRNG.", vi: "Tạo mật khẩu ngẫu nhiên mạnh bằng CSPRNG của trình duyệt." } },
  { id: "password-strength-checker", slug: "password-strength-checker", category: "password", privacyMode: "on-device", iconKey: "shield-check", keywords: ["password", "strength", "entropy"], available: true, title: { en: "Password Strength Checker", vi: "Kiểm tra độ mạnh mật khẩu" }, description: { en: "Check password patterns locally without storing the password.", vi: "Kiểm tra mật khẩu cục bộ mà không lưu lại nội dung." } },
  { id: "qr-generator", slug: "qr-generator", category: "qr", privacyMode: "on-device", iconKey: "qr-code", keywords: ["qr", "barcode", "wifi"], featured: true, available: true, title: { en: "QR Code Generator", vi: "Tạo mã QR" }, description: { en: "Generate QR codes for text, links, Wi-Fi and contact data.", vi: "Tạo mã QR cho văn bản, liên kết, Wi-Fi và thông tin liên hệ." } },
  { id: "qr-reader", slug: "qr-reader", category: "qr", privacyMode: "on-device", iconKey: "scan-qr-code", keywords: ["qr", "scan", "reader", "camera"], available: true, title: { en: "QR Code Reader", vi: "Đọc mã QR" }, description: { en: "Read an image or camera QR code locally before opening anything.", vi: "Đọc QR từ ảnh hoặc camera cục bộ trước khi mở liên kết." } },
  { id: "base64", slug: "base64-encode-decode", category: "encoding", privacyMode: "on-device", iconKey: "binary", keywords: ["base64", "encode", "decode", "url-safe"], available: true, title: { en: "Base64 Encode / Decode", vi: "Mã hóa / giải mã Base64" }, description: { en: "Convert UTF-8 text to and from standard or URL-safe Base64.", vi: "Chuyển văn bản UTF-8 sang và từ Base64 thường hoặc URL-safe." } },
  { id: "hash-generator", slug: "hash-generator", category: "encoding", privacyMode: "on-device", iconKey: "hash", keywords: ["hash", "sha256", "checksum"], available: true, title: { en: "Hash Generator", vi: "Tạo hash" }, description: { en: "Create SHA-256, SHA-384 or SHA-512 hashes locally.", vi: "Tạo hash SHA-256, SHA-384 hoặc SHA-512 cục bộ." } },
  { id: "file-checksum", slug: "file-checksum", category: "encoding", privacyMode: "on-device", iconKey: "file-check", keywords: ["checksum", "file", "sha"], available: true, title: { en: "File Checksum", vi: "Checksum file" }, description: { en: "Compare a local file digest with a publisher checksum.", vi: "So sánh digest của file cục bộ với checksum do nhà phát hành cung cấp." } },
  { id: "jwt-decoder", slug: "jwt-decoder", category: "developer", privacyMode: "on-device", iconKey: "code-xml", keywords: ["jwt", "json", "token", "decode"], available: true, title: { en: "JWT Decoder", vi: "Giải mã JWT" }, description: { en: "Inspect JWT header and payload without verifying or uploading the token.", vi: "Xem header và payload JWT mà không xác minh hay tải token lên." } },
  { id: "json-formatter", slug: "json-formatter", category: "developer", privacyMode: "on-device", iconKey: "braces", keywords: ["json", "format", "minify", "validate"], featured: true, available: true, title: { en: "JSON Formatter", vi: "Định dạng JSON" }, description: { en: "Format, minify and validate JSON with useful error locations.", vi: "Định dạng, rút gọn và kiểm tra JSON với vị trí lỗi rõ ràng." } },
  { id: "uuid-generator", slug: "uuid-generator", category: "developer", privacyMode: "on-device", iconKey: "fingerprint", keywords: ["uuid", "guid", "random"], available: true, title: { en: "UUID Generator", vi: "Tạo UUID" }, description: { en: "Generate UUID v4 values using browser cryptography.", vi: "Tạo UUID v4 bằng cơ chế ngẫu nhiên an toàn của trình duyệt." } },
  { id: "timestamp-converter", slug: "timestamp-converter", category: "developer", privacyMode: "on-device", iconKey: "clock-3", keywords: ["unix", "timestamp", "utc", "date"], available: true, title: { en: "Timestamp Converter", vi: "Chuyển đổi Timestamp" }, description: { en: "Convert Unix seconds or milliseconds to readable time and back.", vi: "Chuyển Unix seconds hoặc milliseconds sang thời gian dễ đọc và ngược lại." } },
  { id: "check-my-ip", slug: "check-my-ip", category: "network", privacyMode: "network-required", iconKey: "globe-2", keywords: ["ip", "ipv4", "ipv6", "asn", "isp"], available: true, title: { en: "Check My IP", vi: "Kiểm tra IP của tôi" }, description: { en: "Inspect your public IP and approximate network information after you choose to connect.", vi: "Kiểm tra IP công khai và thông tin mạng gần đúng sau khi bạn chủ động kết nối." } },
  { id: "ip-lookup", slug: "ip-lookup", category: "network", privacyMode: "network-required", iconKey: "map-pin", keywords: ["ip", "lookup", "geolocation", "asn", "reverse dns"], available: true, title: { en: "IP Lookup", vi: "Tra cứu IP" }, description: { en: "Look up approximate location, ASN and reverse DNS for a public IP.", vi: "Tra cứu vị trí gần đúng, ASN và reverse DNS của một IP công khai." } },
  { id: "vpn-proxy-checker", slug: "vpn-proxy-checker", category: "network", privacyMode: "network-required", iconKey: "shield-question", keywords: ["vpn", "proxy", "tor", "hosting", "privacy"], available: true, title: { en: "VPN / Proxy Checker", vi: "Kiểm tra VPN / Proxy" }, description: { en: "Inspect provider signals for VPN, proxy, Tor, relay and hosting networks.", vi: "Kiểm tra tín hiệu từ nhà cung cấp về VPN, proxy, Tor, relay và hosting." } },
  { id: "ip-leak-test", slug: "ip-leak-test", category: "network", privacyMode: "network-required", iconKey: "radar", keywords: ["ip leak", "vpn leak", "dns", "webrtc"], available: true, title: { en: "IP Leak Test", vi: "Kiểm tra rò rỉ IP" }, description: { en: "Compare public IP, DNS resolver and browser WebRTC observations.", vi: "So sánh IP công khai, DNS resolver và quan sát WebRTC của trình duyệt." } },
  { id: "dns-leak-test", slug: "dns-leak-test", category: "network", privacyMode: "network-required", iconKey: "server-cog", keywords: ["dns leak", "resolver", "vpn", "privacy"], available: true, title: { en: "DNS Leak Test", vi: "Kiểm tra rò rỉ DNS" }, description: { en: "Observe the recursive DNS resolvers used for an explicit test session.", vi: "Quan sát các DNS resolver đệ quy được dùng trong một phiên kiểm tra chủ động." } },
  { id: "webrtc-leak-test", slug: "webrtc-leak-test", category: "network", privacyMode: "network-required", iconKey: "radio-tower", keywords: ["webrtc", "ice", "stun", "ip leak"], available: true, title: { en: "WebRTC Leak Test", vi: "Kiểm tra rò rỉ WebRTC" }, description: { en: "Inspect browser ICE candidates with a self-hosted STUN service.", vi: "Kiểm tra ICE candidate của trình duyệt qua dịch vụ STUN tự host." } },
  { id: "dns-lookup", slug: "dns-lookup", category: "network", privacyMode: "network-required", iconKey: "network", keywords: ["dns", "a", "aaaa", "mx", "txt", "caa"], available: true, title: { en: "DNS Lookup", vi: "Tra cứu DNS" }, description: { en: "Resolve public DNS records through an explicit server-side lookup.", vi: "Tra cứu các bản ghi DNS công khai bằng request phía server chủ động." } },
  { id: "ssl-checker", slug: "ssl-checker", category: "network", privacyMode: "network-required", iconKey: "lock-keyhole", keywords: ["ssl", "tls", "certificate", "https", "expiry"], available: true, title: { en: "SSL Checker", vi: "Kiểm tra SSL" }, description: { en: "Inspect a public website certificate, hostname match and expiration.", vi: "Kiểm tra chứng chỉ website công khai, hostname và ngày hết hạn." } },
  { id: "redirect-checker", slug: "redirect-checker", category: "network", privacyMode: "network-required", iconKey: "route", keywords: ["redirect", "http", "status", "location", "chain"], available: true, title: { en: "Redirect Checker", vi: "Kiểm tra chuyển hướng" }, description: { en: "Follow a guarded HTTP redirect chain without downloading page bodies.", vi: "Theo dõi chuỗi chuyển hướng HTTP được bảo vệ mà không tải nội dung trang." } },
  { id: "http-header-checker", slug: "http-header-checker", category: "network", privacyMode: "network-required", iconKey: "panel-top", keywords: ["headers", "csp", "hsts", "cors", "security headers"], available: true, title: { en: "HTTP Header Checker", vi: "Kiểm tra HTTP Header" }, description: { en: "Review selected response and security headers for a public URL.", vi: "Xem các response header và security header được chọn của URL công khai." } }
];

export const getTool = (slug: string) => toolDefinitions.find((tool) => tool.slug === slug);
