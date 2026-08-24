<p align="center">
  <img src="apps/web/public/logo.jpg" alt="SFranKey Logo" width="110" height="110" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(16,185,129,0.25);" />
</p>

<h1 align="center">SFranKey Tools</h1>

<p align="center">
  <b>Hộp Công Cụ Bảo Mật & Tiện Ích Lập Trình Riêng Tư (100% Local-First)</b><br />
  <i>Privacy-First Developer & Security Toolbox with Transparent Data Boundaries.</i>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://turbo.build"><img src="https://img.shields.io/badge/Turborepo-2.10-EF4444?style=for-the-badge&logo=turborepo" alt="Turborepo" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Vitest-3.2-FCC72B?style=for-the-badge&logo=vitest&logoColor=black" alt="Vitest" /></a>
</p>

---

## 📑 Table of Contents / Mục Lục

- [🇬🇧 English Documentation](#-english-documentation)
  - [1. Introduction & Philosophy](#1-introduction--philosophy)
  - [2. 23 Built-in Developer & Security Tools](#2-23-built-in-developer--security-tools)
  - [3. Monorepo Architecture](#3-monorepo-architecture)
  - [4. Quick Start & Development](#4-quick-start--development)
  - [5. Testing & Quality Assurance](#5-testing--quality-assurance)
  - [6. Security & Privacy Guarantees](#6-security--privacy-guarantees)
- [🇻🇳 Tài Liệu Tiếng Việt](#-tài-liệu-tiếng-việt)
  - [1. Giới Thiệu & Triết Lý Thiết Kế](#1-giới-thiệu--triết-lý-thiết-kế)
  - [2. Danh Mục 23 Công Cụ Tiện Ích](#2-danh-mục-23-công-cụ-tiện-ích)
  - [3. Kiến Trúc Monorepo](#3-kiến-trúc-monorepo)
  - [4. Hướng Dẫn Cài Đặt & Khởi Chạy](#4-hướng-dẫn-cài-đặt--khởi-chạy)
  - [5. Kiểm Thử & Đảm Bảo Chất Lượng](#5-kiểm-thử--đảm-bảo-chất-lượng)
  - [6. Cam Kết Bảo Mật & Quyền Riêng Tư](#6-cam-kết-bảo-mật--quyền-riêng-tư)

---

# 🇬🇧 English Documentation

## 1. Introduction & Philosophy

**SFranKey** is an open-source, luxury-grade web application tailored for developers, security researchers, and privacy-conscious users:
* **100% Local-First Processing**: Sensitive inputs (passwords, TOTP secrets, JWT tokens, files, hashes, QR codes) never leave browser RAM.
* **Radical Transparency**: Network diagnostics explicitly disclose targets and boundaries before connecting.
* **Zero Friction**: No account creation, no telemetry tracking, and no upsells.

---

## 2. 23 Built-in Developer & Security Tools

| Category | Available Tools | Privacy Mode |
|---|---|:---:|
| 🔐 **2FA Authentication** | • TOTP Generator<br>• QR 2FA Scanner | `On-Device (RAM)` |
| 🛡️ **Password Security** | • Password Generator (CSPRNG & EFF Wordlists)<br>• Password Strength Checker (zxcvbn) | `On-Device (RAM)` |
| 📱 **QR Code Suite** | • QR Code Generator (Wi-Fi, vCard, URLs)<br>• QR Code Reader (Camera & Upload) | `On-Device (RAM)` |
| ⚡ **Encoding & Cryptography** | • Base64 Encode / Decode<br>• Hash Generator (SHA-256/384/512)<br>• File Checksum (Streaming 4 MiB Chunks) | `On-Device (RAM)` |
| 🛠️ **Developer Utilities** | • JWT Decoder (Header, Payload, Signature)<br>• JSON Formatter & Minifier<br>• UUID v4 Generator (CSPRNG)<br>• Unix Timestamp Converter | `On-Device (RAM)` |
| 🌐 **Network Diagnostics** | • Check My IP<br>• IP Lookup<br>• VPN / Proxy Checker<br>• IP Leak Test<br>• DNS Leak Test<br>• WebRTC Leak Test<br>• DNS Lookup (DoH)<br>• SSL Certificate Checker<br>• HTTP Redirect Chain Checker<br>• HTTP Header & Security Analyzer | `Network-Required (Explicit)` |

---

## 3. Monorepo Architecture

```
sfrankey/
├── apps/
│   ├── web/           # Next.js 15 App Router Frontend (Bilingual UI, Tailwind CSS, Motion)
│   ├── api/           # Express & Node.js Backend (SSRF Guard, Rate Limiting, Envelope)
│   └── probe/         # Self-hosted DNS & Pixel Leak Probe (UDP/TCP 53)
├── packages/
│   ├── shared/        # Types, schemas, and 23 tool definitions
│   ├── tool-core/     # Pure computation engine (Web Crypto, zxcvbn, Base64, WebAssembly)
│   ├── ui/            # Reusable Design System components (Bento cards, Lucide icons)
│   └── i18n/          # Full bilingual dictionary (Vietnamese & English)
└── deploy/preview/    # Docker Compose preview stack (Nginx, Coturn, Probe, API)
```

---

## 4. Quick Start & Development

### Prerequisites
* **Node.js**: `v20.x` or `v22.x`
* **npm**: `v10.x+`

```bash
# Clone the repository
git clone https://github.com/your-username/sfrankey-tools.git
cd sfrankey-tools

# Install dependencies
npm install

# Start development servers
npm run dev
```

* 🌐 **Web Application**: `http://localhost:3000`
* 🔌 **Backend API**: `http://localhost:4000`

---

## 5. Testing & Quality Assurance

```bash
# Run linting
npm run lint

# Typecheck across all 7 packages
npm run typecheck

# Run unit tests
npm test

# Run End-to-End Playwright test suite
npm run test:e2e

# Build production bundles
npm run build
```

---

## 6. Security & Privacy Guarantees

1. **CSPRNG Randomness**: Cryptographically secure values are derived from `window.crypto.getRandomValues`.
2. **SSRF Guard**: Network checkers strictly forbid private IPs, `127.0.0.1`, link-local addresses, and cloud metadata endpoints (`169.254.169.254`).
3. **No Secret Ingestion**: Secrets never enter URLs, analytics logs, or persistent cookies.

---

<br />

---

# 🇻🇳 Tài Liệu Tiếng Việt

## 1. Giới Thiệu & Triết Lý Thiết Kế

**SFranKey** là bộ công cụ trực tuyến mã nguồn mở, được phát triển theo tiêu chuẩn giao diện cao cấp (*Luxury Bento Suite*) dành riêng cho lập trình viên, chuyên gia bảo mật và người dùng quan tâm đến an toàn thông tin:
* **Xử lý Cục bộ 100% (Local-First)**: Mật khẩu, mã 2FA, JWT, file, hash và mã QR chỉ được xử lý tạm thời trong RAM của trình duyệt.
* **Minh Bạch Tuyệt Đối**: Mọi công cụ mạng đều nêu rõ địa chỉ đích và chỉ kích hoạt khi có sự xác nhận của người dùng.
* **Trải Nghiệm Tinh Gọn**: Không yêu cầu đăng ký tài khoản, không gắn mã theo dõi quảng cáo, không phiền toái.

---

## 2. Danh Mục 23 Công Cụ Tiện Ích

| Danh Mục | Danh Sách Công Cụ | Chế Độ Riêng Tư |
|---|---|:---:|
| 🔐 **Xác Thực 2FA** | • Tạo mã TOTP trực tiếp<br>• Quét & đọc mã QR 2FA | `Cục bộ (RAM)` |
| 🛡️ **Mật Khẩu** | • Tạo mật khẩu ngẫu nhiên & Passphrase EFF<br>• Kiểm tra độ mạnh mật khẩu (zxcvbn) | `Cục bộ (RAM)` |
| 📱 **Mã QR** | • Tạo mã QR (Wi-Fi, Danh bạ, URL, Text)<br>• Đọc mã QR từ Camera hoặc Ảnh | `Cục bộ (RAM)` |
| ⚡ **Mã Hóa & Băm** | • Mã hóa / Giải mã Base64<br>• Tạo mã băm SHA-256/384/512<br>• Kiểm tra Checksum File (Chunk 4 MiB) | `Cục bộ (RAM)` |
| 🛠️ **Tiện Ích Developer** | • Giải mã Token JWT<br>• Định dạng & Rút gọn JSON<br>• Tạo UUID v4 bảo mật<br>• Chuyển đổi Unix Timestamp | `Cục bộ (RAM)` |
| 🌐 **Chẩn Đoán Mạng** | • Kiểm tra IP của tôi<br>• Tra cứu thông tin IP & ASN<br>• Kiểm tra VPN / Proxy<br>• Kiểm tra rò rỉ IP<br>• Kiểm tra rò rỉ DNS<br>• Kiểm tra rò rỉ WebRTC<br>• Tra cứu bản ghi DNS (DoH)<br>• Kiểm tra chứng chỉ SSL/TLS<br>• Kiểm tra chuỗi chuyển hướng (Redirect)<br>• Phân tích HTTP Security Headers | `Kết nối Mạng (Chủ động)` |

---

## 3. Kiến Trúc Monorepo

Hệ thống được tổ chức theo kiến trúc monorepo hiện đại bằng Turborepo:
* **`apps/web`**: Ứng dụng Next.js 15 App Router hỗ trợ đa ngôn ngữ (VI & EN), dark/light mode và hiệu ứng mượt mà.
* **`apps/api`**: Backend Node.js / Express chuyên trách kiểm tra mạng an toàn và chống tấn công SSRF.
* **`apps/probe`**: Máy chủ DNS & Web Beacon đo kiểm rò rỉ DNS tự host.
* **`packages/tool-core`**: Thư viện thuật toán lõi chạy trong Web Worker và WebAssembly.
* **`packages/ui`**: Thư viện giao diện chuẩn Luxury Bento Box với icon Lucide SVG.
* **`packages/i18n`**: Hệ thống từ điển song ngữ hoàn chỉnh.

---

## 4. Hướng Dẫn Cài Đặt & Khởi Chạy

```bash
# 1. Clone mã nguồn
git clone https://github.com/your-username/sfrankey-tools.git
cd sfrankey-tools

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi động môi trường phát triển
npm run dev
```

Truy cập:
* 🌐 Giao diện Web: `http://localhost:3000`
* 🔌 Backend API: `http://localhost:4000`

---

## 5. Kiểm Thử & Đảm Bảo Chất Lượng

```bash
# Kiểm tra định dạng mã nguồn (ESLint)
npm run lint

# Kiểm tra kiểu dữ liệu toàn bộ 7 package
npm run typecheck

# Chạy Unit Test (Vitest)
npm test

# Chạy End-to-End Test (Playwright)
npm run test:e2e

# Build sản phẩm hoàn chỉnh
npm run build
```

---

## 6. Cam Kết Bảo Mật & Quyền Riêng Tư

1. **Bộ sinh số ngẫu nhiên mật mã (CSPRNG)**: Sử dụng trực tiếp `window.crypto.getRandomValues` của trình duyệt.
2. **Cơ chế chống SSRF**: Toàn bộ request mạng đều chặn IP cục bộ, loopback `127.0.0.1`, LAN và endpoint cloud metadata (`169.254.169.254`).
3. **Tuyệt đối không lưu dữ liệu nhạy cảm**: Không lưu secret vào URL, cookie hay máy chủ trung gian.

---

<p align="center">
  <b>SFranKey — Open Source Security & Developer Tools</b><br />
  <sub>Được xây dựng với tinh thần tôn trọng quyền riêng tư và mang lại trải nghiệm tối ưu cho người dùng.</sub>
</p>
