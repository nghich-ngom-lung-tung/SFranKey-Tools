const en = {
  "totp-generator": {
    guide: "Paste or type your base32 secret key, customize period or algorithm if needed, then copy the 6-digit one-time password.",
    privacy: "Secrets and generated TOTP tokens are computed entirely in your browser's RAM using standard HMAC-SHA. Secrets are never sent to any server.",
    faq: "Does SFranKey save my 2FA secrets? No. Secrets are strictly processed locally and disappear when you leave or refresh the page."
  },
  "qr-2fa-scanner": {
    guide: "Upload, paste, or scan a 2FA QR code image from your camera to extract and inspect the secret key, issuer, and otpauth URI parameters.",
    privacy: "Image processing and barcode decoding run 100% locally via Canvas API and WebAssembly. Camera streams are never transmitted.",
    faq: "Can I use this scanner offline? Yes. The QR decode engine works completely on-device without network connectivity."
  },
  "password-generator": {
    guide: "Select desired character sets, length, and options (symbols, ambiguous exclusion), then copy the cryptographically secure random password.",
    privacy: "Generated passwords utilize the browser's native `window.crypto.getRandomValues` CSPRNG and are never stored or logged anywhere.",
    faq: "Is this password generator secure? Yes. It uses browser-native cryptographic randomness and evaluates entropy locally."
  },
  "password-strength-checker": {
    guide: "Enter a password or passphrase to inspect its entropy, brute-force crack time estimates, and pattern vulnerabilities.",
    privacy: "Passwords are evaluated in-memory using local zxcvbn pattern matching. Passwords are never sent to an external API or database.",
    faq: "Will checking my password leak it to a database? No. The entire strength analysis runs on your machine."
  },
  "qr-generator": {
    guide: "Choose a payload type, fill only the fields you need, then generate the preview. The QR image is created in this browser.",
    privacy: "Text, links, contact details and Wi-Fi settings are not sent to an API. Download creates a file only after you choose it.",
    faq: "Does generating a QR upload my data? No. The payload is encoded locally and the preview is kept in browser memory."
  },
  "qr-reader": {
    guide: "Upload, drop, paste or scan a QR image. Review the decoded value and its detected type before deciding whether to open a safe HTTP or HTTPS link.",
    privacy: "Images, camera frames and decoded values stay on this device. The reader never navigates automatically.",
    faq: "Can a QR link open by itself? No. Only HTTP and HTTPS links get a confirmation action."
  },
  "base64-encode-decode": {
    guide: "Use Text for UTF-8 values or File for binary data. Pick the direction and alphabet, then run the operation and download only when ready.",
    privacy: "Base64 input, decoded bytes and filenames remain in memory. This tool does not encrypt or upload the value.",
    faq: "Is Base64 encryption? No. It is a reversible representation, not confidentiality."
  },
  "hash-generator": {
    guide: "Enter exact UTF-8 text, choose SHA-256, SHA-384 or SHA-512, select Hex or Base64, and press Hash. Compare an expected digest when needed.",
    privacy: "Text and digest values stay in browser memory and are never sent to the API or analytics.",
    faq: "Will visually similar Unicode text always hash the same? No. Different UTF-8 bytes produce different digests."
  },
  "file-checksum": {
    guide: "Choose a file up to 200 MiB, select an algorithm and format, then start the checksum worker. Progress and cancel are available while chunks are processed.",
    privacy: "The file is read sequentially on this device. It is not uploaded, persisted or included in telemetry.",
    faq: "Does checksum read the complete file into memory? No. The worker processes 4 MiB chunks."
  },
  "jwt-decoder": {
    guide: "Paste a compact three-part JWT and decode it locally to inspect the header, payload, signature and timing claims.",
    privacy: "The token stays in browser memory. No verification key lookup or API request is performed.",
    faq: "Does decoding verify the JWT signature? No. It only decodes the representation; it never proves authenticity."
  },
  "json-formatter": {
    guide: "Paste strict JSON, choose an indentation style and run Validate, Format or Minify. Diagnostics point to the first issue.",
    privacy: "JSON is processed in a worker in this browser. It is not uploaded, persisted or included in analytics.",
    faq: "Are duplicate keys accepted? No. Duplicate keys are rejected so the result is not ambiguous."
  },
  "uuid-generator": {
    guide: "Choose a batch size and display format, then generate UUID v4 values with the browser's secure random source.",
    privacy: "UUIDs are generated locally and disappear when you reset or leave the page. Nothing is synchronized.",
    faq: "Is UUID v4 predictable here? The generator uses Web Crypto and fails closed when secure randomness is unavailable."
  },
  "timestamp-converter": {
    guide: "Convert Unix seconds or milliseconds to UTC, device time or an IANA time zone. Convert a wall time back with explicit DST choices.",
    privacy: "Timestamps and time-zone choices stay in memory. The optional time API is not used by this converter.",
    faq: "Why do I need to choose Earlier or Later? Some daylight-saving transitions make a wall time ambiguous or nonexistent."
  },
  "check-my-ip": {
    guide: "Start the check explicitly to inspect the public IP and approximate network profile visible to the service.",
    privacy: "The request naturally exposes your source IP to SFranKey and IPinfo. Browser details are computed locally and results are not saved.",
    faq: "Does an unavailable IPv6 result prove I have no IPv6? No. It only means this connection did not expose one to the configured endpoint."
  },
  "ip-lookup": {
    guide: "Enter one IPv4 or IPv6 address to inspect its public scope, approximate location, ASN and reverse DNS when available.",
    privacy: "Public IP input is sent to SFranKey and IPinfo after you press Check. Private and reserved addresses are classified without IPinfo.",
    faq: "Is IP geolocation exact? No. City and region values are approximate network data, not a physical address."
  },
  "vpn-proxy-checker": {
    guide: "Check your source IP or an entered public IP for VPN, proxy, Tor, relay, hosting and mobile signals.",
    privacy: "The selected IP is sent to the configured IP intelligence provider only after your action.",
    faq: "Can this prove a VPN is active? No. Signals can be unknown, stale, false positive or false negative."
  },
  "ip-leak-test": {
    guide: "Run public-IP, DNS resolver and local WebRTC measurements together, then compare the available observations.",
    privacy: "WebRTC candidates stay in this browser. Public IP and DNS probe observations cross the disclosed network boundary.",
    faq: "Does a different result always mean a leak? No. Split tunneling, public resolvers and provider data can also explain differences."
  },
  "dns-leak-test": {
    guide: "Start a short-lived session that loads unique probe images and observes which recursive resolvers contact the authoritative probe.",
    privacy: "The self-hosted probe temporarily holds a random session token and resolver IPs for up to 120 seconds.",
    faq: "Is a public resolver automatically a leak? No. Resolver choice and VPN configuration determine what a difference means."
  },
  "webrtc-leak-test": {
    guide: "Gather ICE candidates for up to five seconds through the configured self-hosted STUN server.",
    privacy: "Candidates are parsed locally and never sent to the SFranKey API. The STUN server naturally sees your source IP.",
    faq: "Why do I see an mDNS name? Modern browsers use mDNS to protect local host addresses; the tool does not resolve it."
  },
  "dns-lookup": {
    guide: "Enter a public hostname, choose record types and run a normalized DNS-over-HTTPS lookup.",
    privacy: "The hostname is sent through the SFranKey API to Cloudflare DoH; your browser IP is not forwarded to Cloudflare.",
    faq: "Is this a DNS leak test? No. It queries a chosen resolver from the API and does not identify your device resolver."
  },
  "ssl-checker": {
    guide: "Enter a hostname to inspect the certificate and TLS connection on port 443 after public-address validation.",
    privacy: "The hostname is sent to SFranKey and the API connects to the target website. No page body is downloaded.",
    faq: "Does this check revocation or CT? Not in this release; it covers chain authorization, hostname and validity dates."
  },
  "redirect-checker": {
    guide: "Enter an HTTP or HTTPS URL to inspect up to ten manually validated redirect hops.",
    privacy: "The URL is sent to SFranKey and each public target sees the checker user agent. Bodies, cookies and browser headers are not forwarded.",
    faq: "Can it access internal addresses? No. Private, reserved, metadata and mixed DNS destinations are blocked at every hop."
  },
  "http-header-checker": {
    guide: "Inspect an allowlisted set of response and security headers on a public URL after validated redirects.",
    privacy: "The URL is sent to SFranKey and the public target. Set-Cookie and arbitrary raw headers are never returned to the browser.",
    faq: "Does a present CSP mean the site is secure? No. Presence is informational; policy quality still requires review."
  },
} as const;

const vi = {
  "totp-generator": {
    guide: "Dán hoặc nhập secret key (base32), tùy chỉnh chu kỳ (30s) hoặc thuật toán nếu cần, sau đó sao chép mã OTP 6 chữ số.",
    privacy: "Secret key và mã OTP được tính toán 100% trong bộ nhớ RAM trình duyệt bằng chuẩn HMAC-SHA. Tuyệt đối không gửi về máy chủ.",
    faq: "SFranKey có lưu secret 2FA của tôi không? Không. Secret chỉ tồn tại tạm thời trên trình duyệt và biến mất ngay khi bạn tải lại trang."
  },
  "qr-2fa-scanner": {
    guide: "Tải lên, dán ảnh hoặc dùng camera quét mã QR 2FA để trích xuất secret key, tên dịch vụ và thông số otpauth.",
    privacy: "Quá trình đọc ảnh và giải mã barcode diễn ra 100% cục bộ qua Canvas API và WebAssembly. Luồng camera không gửi qua mạng.",
    faq: "Tôi có thể dùng máy quét này khi offline không? Có. Engine đọc QR hoạt động hoàn toàn cục bộ trên thiết bị của bạn."
  },
  "password-generator": {
    guide: "Chọn bộ ký tự mong muốn, độ dài và các tùy chọn loại trừ ký tự gây nhầm lẫn, sau đó sao chép mật khẩu ngẫu nhiên mạnh.",
    privacy: "Mật khẩu được sinh bằng bộ sinh số ngẫu nhiên mật mã chuẩn `window.crypto.getRandomValues` của trình duyệt và không bao giờ lưu trữ.",
    faq: "Mật khẩu tạo ra có an toàn không? Có. Sử dụng CSPRNG gốc của hệ điều hành và đánh giá độ mạnh cục bộ."
  },
  "password-strength-checker": {
    guide: "Nhập mật khẩu hoặc cụm từ mật khẩu để phân tích entropy, thời gian crack dự kiến và các mẫu dễ bị tấn công.",
    privacy: "Mật khẩu được phân tích trong RAM bằng thuật toán zxcvbn. Mật khẩu không bao giờ gửi về API hay bất kỳ cơ sở dữ liệu nào.",
    faq: "Kiểm tra mật khẩu có làm lộ mật khẩu không? Không. Toàn bộ quá trình phân tích đều chạy trực tiếp trên máy của bạn."
  },
  "qr-generator": {
    guide: "Chọn loại payload, chỉ điền trường cần thiết rồi tạo bản xem trước. Hình QR được tạo ngay trong trình duyệt.",
    privacy: "Văn bản, liên kết, liên hệ và Wi-Fi không gửi lên API. File tải xuống chỉ được tạo khi bạn chủ động chọn.",
    faq: "Tạo QR có upload dữ liệu không? Không. Payload được mã hóa cục bộ và bản xem trước chỉ ở trong memory."
  },
  "qr-reader": {
    guide: "Tải lên, kéo thả, dán hoặc quét ảnh QR. Kiểm tra giá trị và loại nhận diện trước khi quyết định mở liên kết HTTP/HTTPS.",
    privacy: "Ảnh, khung hình camera và giá trị đã đọc chỉ ở trên thiết bị. Reader không tự điều hướng.",
    faq: "Liên kết QR có tự mở không? Không. Chỉ liên kết HTTP và HTTPS mới có nút xác nhận."
  },
  "base64-encode-decode": {
    guide: "Dùng tab Văn bản cho UTF-8 hoặc File cho dữ liệu nhị phân. Chọn chiều xử lý và bảng ký tự rồi chạy thao tác.",
    privacy: "Input Base64, bytes đã giải mã và tên file chỉ ở trong memory. Công cụ không mã hóa hoặc upload dữ liệu.",
    faq: "Base64 có phải mã hóa không? Không. Đây là biểu diễn có thể đảo ngược, không cung cấp tính bí mật."
  },
  "hash-generator": {
    guide: "Nhập văn bản UTF-8 chính xác, chọn SHA-256, SHA-384 hoặc SHA-512, chọn Hex hoặc Base64 rồi bấm Hash.",
    privacy: "Văn bản và digest chỉ ở trong memory trình duyệt và không gửi lên API hoặc analytics.",
    faq: "Unicode nhìn giống nhau có luôn hash giống nhau không? Không. Bytes UTF-8 khác nhau tạo digest khác nhau."
  },
  "file-checksum": {
    guide: "Chọn file tối đa 200 MiB, chọn thuật toán và định dạng rồi chạy worker checksum. Có tiến trình và nút hủy.",
    privacy: "File được đọc tuần tự trên thiết bị. File không upload, lưu trữ hoặc đưa vào telemetry.",
    faq: "Checksum có nạp toàn bộ file vào memory không? Không. Worker xử lý theo chunk 4 MiB."
  },
  "jwt-decoder": {
    guide: "Dán JWT compact ba phần và giải mã cục bộ để xem header, payload, chữ ký và claim thời gian.",
    privacy: "Token chỉ ở trong bộ nhớ trình duyệt. Không có tra cứu khóa xác minh hay request API.",
    faq: "Giải mã có xác minh chữ ký JWT không? Không. Công cụ chỉ đọc dạng token và không chứng minh tính xác thực."
  },
  "json-formatter": {
    guide: "Dán JSON strict, chọn kiểu thụt lề và chạy Kiểm tra, Định dạng hoặc Rút gọn. Chẩn đoán sẽ chỉ ra vị trí lỗi.",
    privacy: "JSON được xử lý trong worker trên trình duyệt. Không upload, lưu trữ hay đưa vào analytics.",
    faq: "Key trùng có được chấp nhận không? Không. Key trùng bị từ chối để kết quả không mơ hồ."
  },
  "uuid-generator": {
    guide: "Chọn số lượng và cách hiển thị, sau đó tạo UUID v4 bằng nguồn ngẫu nhiên an toàn của trình duyệt.",
    privacy: "UUID được tạo cục bộ và biến mất khi đặt lại hoặc rời trang. Không có đồng bộ.",
    faq: "UUID v4 có thể đoán được không? Công cụ dùng Web Crypto và từ chối khi không có nguồn ngẫu nhiên an toàn."
  },
  "timestamp-converter": {
    guide: "Chuyển Unix seconds hoặc milliseconds sang UTC, giờ thiết bị hoặc múi giờ IANA. Khi chuyển ngược, chọn rõ DST.",
    privacy: "Timestamp và lựa chọn múi giờ chỉ ở trong memory. Converter không dùng time API tùy chọn.",
    faq: "Vì sao phải chọn Lần trước hoặc Lần sau? DST có thể khiến một giờ vừa mơ hồ vừa không tồn tại."
  },
  "check-my-ip": {
    guide: "Chủ động bắt đầu để xem IP công khai và hồ sơ mạng gần đúng mà dịch vụ quan sát được.",
    privacy: "Request tự nhiên làm lộ source IP cho SFranKey và IPinfo. Thông tin trình duyệt được tính cục bộ và kết quả không được lưu.",
    faq: "Không thấy IPv6 có chứng minh thiết bị không có IPv6 không? Không. Chỉ có nghĩa kết nối hiện tại không lộ IPv6 cho endpoint."
  },
  "ip-lookup": {
    guide: "Nhập một IPv4 hoặc IPv6 để xem scope, vị trí gần đúng, ASN và reverse DNS khi có.",
    privacy: "IP công khai được gửi tới SFranKey và IPinfo sau khi bạn bấm. IP private/reserved được phân loại mà không gọi IPinfo.",
    faq: "Geolocation IP có chính xác không? Không. Thành phố và khu vực là dữ liệu mạng gần đúng, không phải địa chỉ vật lý."
  },
  "vpn-proxy-checker": {
    guide: "Kiểm tra source IP hoặc IP công khai đã nhập theo tín hiệu VPN, proxy, Tor, relay, hosting và mobile.",
    privacy: "IP được chọn chỉ gửi tới nhà cung cấp intelligence sau thao tác của bạn.",
    faq: "Có chứng minh chắc chắn VPN đang bật không? Không. Tín hiệu có thể unknown, cũ, false positive hoặc false negative."
  },
  "ip-leak-test": {
    guide: "Chạy song song public IP, DNS resolver và WebRTC cục bộ rồi so sánh các quan sát khả dụng.",
    privacy: "WebRTC candidate ở lại trình duyệt. Public IP và DNS probe đi qua network boundary đã công khai.",
    faq: "Kết quả khác nhau luôn là leak không? Không. Split tunneling, public resolver hoặc dữ liệu provider cũng có thể tạo khác biệt."
  },
  "dns-leak-test": {
    guide: "Tạo phiên ngắn hạn, tải các probe image duy nhất và quan sát recursive resolver gọi authoritative probe.",
    privacy: "Probe tự host tạm giữ token ngẫu nhiên và resolver IP tối đa 120 giây.",
    faq: "Public resolver có tự động là leak không? Không. Ý nghĩa phụ thuộc resolver và cấu hình VPN."
  },
  "webrtc-leak-test": {
    guide: "Thu thập ICE candidate tối đa năm giây qua STUN server tự host đã cấu hình.",
    privacy: "Candidate được phân tích cục bộ và không gửi tới API SFranKey. STUN server tự nhiên nhìn thấy source IP.",
    faq: "Vì sao thấy tên mDNS? Browser hiện đại dùng mDNS để che địa chỉ local; công cụ không resolve tên đó."
  },
  "dns-lookup": {
    guide: "Nhập hostname công khai, chọn record type rồi chạy lookup DNS-over-HTTPS đã normalize.",
    privacy: "Hostname đi qua API SFranKey tới Cloudflare DoH; browser IP của bạn không được forward tới Cloudflare.",
    faq: "Đây có phải DNS leak test không? Không. Tool query resolver đã chọn từ API, không nhận diện resolver thiết bị."
  },
  "ssl-checker": {
    guide: "Nhập hostname để xem certificate và kết nối TLS port 443 sau khi xác thực địa chỉ công khai.",
    privacy: "Hostname được gửi tới SFranKey và API kết nối website đích. Không tải body trang.",
    faq: "Có kiểm tra revocation hoặc CT không? Chưa; bản này kiểm tra chain authorization, hostname và ngày hiệu lực."
  },
  "redirect-checker": {
    guide: "Nhập URL HTTP/HTTPS để kiểm tra tối đa mười hop redirect được xác thực thủ công.",
    privacy: "URL gửi tới SFranKey và mỗi target công khai thấy checker user agent. Không forward cookie hay browser header.",
    faq: "Có truy cập địa chỉ nội bộ không? Không. Private, reserved, metadata và mixed DNS bị chặn ở mọi hop."
  },
  "http-header-checker": {
    guide: "Kiểm tra tập header response/security allowlist trên URL công khai sau redirect đã xác thực.",
    privacy: "URL gửi tới SFranKey và target công khai. Set-Cookie cùng raw header tùy ý không được trả về browser.",
    faq: "Có CSP nghĩa là website an toàn không? Không. Sự hiện diện chỉ mang tính thông tin; chất lượng policy vẫn cần review."
  },
} as const;

export const toolDetailsDictionaries = {
  en: { toolDetails: en },
  vi: { toolDetails: vi },
} as const;
