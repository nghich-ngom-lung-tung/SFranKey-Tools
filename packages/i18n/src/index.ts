import type { Locale } from "@sfrankey/shared";

export const dictionaries = {
  en: {
    brandDescriptor: "Security & Developer Tools",
    tagline: "Private-first tools for security and development.",
    nav: { tools: "All tools", about: "About", privacy: "Privacy", security: "Security", request: "Request a tool" },
    home: { eyebrow: "SFranKey Tools", title: "Useful tools. Private by default.", description: "A focused toolbox for 2FA, passwords, QR codes, hashing and everyday development tasks. Sensitive values stay in your browser.", cta: "Explore tools", featured: "Popular tools", why: "Built with privacy in mind", whyText: "On-device tools do not upload your secrets, passwords, tokens or files. Every tool explains what happens to your data." },
    common: { search: "Search tools", copy: "Copy", copied: "Copied", reset: "Reset", download: "Download", clear: "Clear", generate: "Generate", invalid: "Please check the value and try again.", onDevice: "Processed on this device", noResults: "No tools found.", loading: "Loading…", error: "Something went wrong." },
    categories: { "2fa": "2FA & OTP", password: "Passwords", qr: "QR Code", encoding: "Encoding & Hashing", developer: "Developer" },
    tool: { guide: "How it works", privacy: "Privacy", related: "Related tools", noVerification: "Decoding does not verify a token.", noEncryption: "Encoding and hashing are not encryption." },
    feedback: { bugTitle: "Report a bug", requestTitle: "Request a tool", subject: "Subject", message: "Message", email: "Email (optional)", submit: "Send", success: "Thanks — your message was sent.", failure: "Could not send the message. Please try again." }
  },
  vi: {
    brandDescriptor: "Công cụ Bảo mật & Lập trình",
    tagline: "Bộ công cụ bảo mật và lập trình ưu tiên quyền riêng tư.",
    nav: { tools: "Tất cả công cụ", about: "Giới thiệu", privacy: "Quyền riêng tư", security: "Bảo mật", request: "Đề xuất công cụ" },
    home: { eyebrow: "SFranKey Tools", title: "Công cụ hữu ích. Riêng tư mặc định.", description: "Bộ công cụ tập trung cho 2FA, mật khẩu, QR, hash và các tác vụ lập trình hằng ngày. Dữ liệu nhạy cảm ở lại trong trình duyệt.", cta: "Khám phá công cụ", featured: "Công cụ phổ biến", why: "Thiết kế với quyền riêng tư", whyText: "Công cụ trên thiết bị không tải secret, mật khẩu, token hay file của bạn lên server. Mỗi công cụ giải thích rõ dữ liệu được xử lý thế nào." },
    common: { search: "Tìm công cụ", copy: "Sao chép", copied: "Đã sao chép", reset: "Đặt lại", download: "Tải xuống", clear: "Xóa", generate: "Tạo", invalid: "Vui lòng kiểm tra giá trị và thử lại.", onDevice: "Xử lý trên thiết bị này", noResults: "Không tìm thấy công cụ.", loading: "Đang tải…", error: "Đã xảy ra lỗi." },
    categories: { "2fa": "2FA & OTP", password: "Mật khẩu", qr: "Mã QR", encoding: "Mã hóa & Hash", developer: "Lập trình" },
    tool: { guide: "Cách hoạt động", privacy: "Quyền riêng tư", related: "Công cụ liên quan", noVerification: "Giải mã không đồng nghĩa với xác minh token.", noEncryption: "Encoding và hashing không phải là mã hóa." },
    feedback: { bugTitle: "Báo lỗi", requestTitle: "Đề xuất công cụ", subject: "Tiêu đề", message: "Nội dung", email: "Email (không bắt buộc)", submit: "Gửi", success: "Cảm ơn — tin nhắn đã được gửi.", failure: "Không thể gửi tin nhắn. Vui lòng thử lại." }
  }
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
