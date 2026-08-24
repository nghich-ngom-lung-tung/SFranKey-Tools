import type { Locale } from "@sfrankey/shared";
import { qrSuiteDictionaries } from "./qr-suite";
import { toolDetailsDictionaries } from "./tool-details";
import { developerSuiteDictionaries } from "./developer-suite";
import { networkSuiteDictionaries } from "./network-suite";

const aboutDictionaries = {
  en: {
    metaTitle: "About SFranKey – Private Security & Developer Tools",
    metaDescription: "Learn how SFranKey keeps security and developer tools local-first, transparent and easy to use.",
    eyebrow: "ABOUT SFRANKEY",
    title: "Useful tools. Your data stays yours.",
    description: "SFranKey is a focused toolbox for security and development. On-device utilities keep sensitive values in the browser, while network diagnostics disclose exactly when a connection is required.",
    primaryCta: "Explore tools",
    privacyCta: "Read our privacy model",
    securityCta: "See security details",
    trust: ["Tools for local and network tasks", "6 categories", "VI · EN", "No account required"],
    why: {
      eyebrow: "WHY SFRANKEY EXISTS",
      title: "Small utilities should not require big privacy tradeoffs.",
      description: "Everyday security and developer tasks are useful enough to deserve a clear, calm and trustworthy place to run.",
      problems: [
        { title: "Scattered utilities", text: "A small task should not mean opening a different website for every format, code or checksum." },
        { title: "Unclear privacy", text: "People deserve to know where an input goes before they paste a secret, token, password or file." },
        { title: "Unnecessary friction", text: "Simple tasks should not require an account, distracting ads or an interface built around upsells." }
      ],
      statement: "SFranKey brings the everyday essentials into one focused workspace: useful, fast and transparent by design."
    },
    manifesto: {
      eyebrow: "THE PRODUCT MANIFESTO",
      title: "Designed to help you finish a task, then leave.",
      body: "SFranKey is not trying to become a place that stores your data. It is designed to help you complete a task and move on, while sensitive values remain under your control.",
      principles: [
        { title: "Local-first", text: "Sensitive tool input is processed in browser memory whenever the job can be completed there." },
        { title: "Transparent by default", text: "Each tool explains what it uses, what it returns and where its real limits are." },
        { title: "Less friction", text: "No account, vault or onboarding is required to use the toolbox." },
        { title: "Right expectations", text: "Decode is not verify, hashing is not encryption and crack time is only an estimate." }
      ]
    },
    flow: {
      eyebrow: "HOW SFRANKEY WORKS",
      title: "The shortest useful path from input to result.",
      description: "Most tools follow a simple local path. The browser receives the input, runs the tool logic and returns a result without uploading the sensitive value.",
      steps: [
        { label: "User input", text: "A secret, password, token, image, file or developer value." },
        { label: "Browser memory", text: "Tool logic runs locally while the page is open." },
        { label: "Local result", text: "Copy, inspect, download or reset when you are done." },
        { label: "State released", text: "Reset or leaving the page clears the sensitive working state." }
      ],
      networkTitle: "An explicit boundary for network diagnostics",
      networkText: "On-device tools keep sensitive input in browser memory. Network diagnostics only connect after you choose an action and disclose the destination before the request starts.",
      networkItems: ["Time sync returns only a timestamp", "Network checks disclose the API, provider or target involved"],
      localLabel: "Local path",
      networkLabel: "Optional network path",
      inputLabel: "Input",
      memoryLabel: "Browser memory",
      resultLabel: "Result",
      noUpload: "No upload",
      noSecretApi: "No secret API request",
      ariaLabel: "Diagram showing local processing from user input to browser memory and local result",
      matrix: { headers: ["Data", "Processing", "Network"], rows: [["Secrets, passwords, JWTs, JSON", "Browser memory", "Not sent"], ["QR images and file checksums", "On this device", "No upload"], ["Network diagnostic target", "Only after your action", "Disclosed API, provider or target"], ["Feedback", "Only fields you submit", "Explicit by choice"]] }
    },
    ecosystem: {
      eyebrow: "THE TOOLBOX",
      title: "A small ecosystem for everyday work.",
      description: "The toolbox spans local utilities and explicit network diagnostics in Vietnamese and English. This map is generated from the same registry used by navigation, search and the catalog.",
      toolCount: "tools",
      categoryCount: "categories",
      languageCount: "languages",
      openCategory: "Explore category",
      sampleMore: "more"
    },
    technical: {
      eyebrow: "UNDER THE INTERFACE",
      title: "A little technology, used with restraint.",
      description: "The implementation details matter because they support the promise: sensitive work stays close to the person using the tool.",
      capabilities: [
        { title: "Web Crypto", text: "Passwords and UUIDs use the browser's cryptographically secure random source." },
        { title: "Offline analysis", text: "The strength analyzer and passphrase wordlist run locally; passwords are not sent for lookup." },
        { title: "Browser memory", text: "Sensitive values do not enter URLs, preferences, cookies or analytics events." },
        { title: "Explicit API boundary", text: "The API serves health, time sync, feedback and opt-in network diagnostics with a visible data boundary." }
      ]
    },
    limits: {
      eyebrow: "CLEAR LIMITS",
      title: "Privacy is also about honest expectations.",
      description: "A local tool can still be the wrong tool for a job. We make those boundaries visible so the result is easier to trust.",
      items: [
        { title: "JWT Decoder only decodes", text: "It does not verify a token signature or prove that a token is trustworthy." },
        { title: "Encoding is not encryption", text: "Base64 changes representation and hashing creates a digest; neither hides data like encryption does." },
        { title: "Crack time is an estimate", text: "Password strength timing depends on hardware, rate limits, algorithms and attacker models." },
        { title: "Check QR links first", text: "A QR reader shows content before opening a link so you can decide what to trust." },
        { title: "Not a security replacement", text: "SFranKey complements, but does not replace, a password manager, audit or security professional." }
      ],
      privacyLink: "Read privacy model",
      securityLink: "Read security baseline"
    },
    cta: {
      eyebrow: "READY WHEN YOU ARE",
      title: "Use useful tools without handing your data to a black box.",
      text: "Start with a local-first tool, see how it behaves and keep control of the values you bring into the workspace.",
      primary: "Explore tools",
      secondary: "Request a tool",
      trust: "No account · No sensitive input upload · VI/EN"
    }
  },
  vi: {
    metaTitle: "Giới thiệu SFranKey – Công cụ bảo mật ưu tiên quyền riêng tư",
    metaDescription: "Tìm hiểu cách SFranKey xây dựng bộ công cụ bảo mật và lập trình local-first, minh bạch và dễ dùng.",
    eyebrow: "ABOUT SFRANKEY",
    title: "Công cụ hữu ích. Dữ liệu thuộc về bạn.",
    description: "SFranKey là bộ công cụ tập trung cho bảo mật và lập trình. Công cụ cục bộ giữ dữ liệu nhạy cảm trong trình duyệt, còn công cụ chẩn đoán mạng công khai rõ thời điểm cần kết nối.",
    primaryCta: "Khám phá công cụ",
    privacyCta: "Đọc mô hình quyền riêng tư",
    securityCta: "Xem chi tiết bảo mật",
    trust: ["Công cụ local và network", "6 nhóm", "VI · EN", "Không cần tài khoản"],
    why: {
      eyebrow: "VÌ SAO SFRANKEY TỒN TẠI",
      title: "Những công cụ nhỏ không nên đòi hỏi sự đánh đổi lớn.",
      description: "Các tác vụ bảo mật và lập trình hằng ngày xứng đáng có một nơi rõ ràng, bình tĩnh và đáng tin cậy để xử lý.",
      problems: [
        { title: "Công cụ bị phân tán", text: "Một tác vụ nhỏ không nên bắt bạn mở một website khác cho từng định dạng, mã hoặc checksum." },
        { title: "Quyền riêng tư không rõ ràng", text: "Bạn cần biết input đi đâu trước khi dán secret, token, mật khẩu hoặc file vào một công cụ." },
        { title: "Ma sát không cần thiết", text: "Tác vụ đơn giản không nên yêu cầu tài khoản, quảng cáo gây nhiễu hay giao diện tập trung vào bán thêm." }
      ],
      statement: "SFranKey gom những nhu cầu thiết yếu vào một workspace tập trung: hữu ích, nhanh và minh bạch ngay từ thiết kế."
    },
    manifesto: {
      eyebrow: "TUYÊN NGÔN SẢN PHẨM",
      title: "Giúp bạn hoàn thành tác vụ, rồi rời đi.",
      body: "SFranKey không cố trở thành nơi lưu giữ dữ liệu của bạn. Nó được thiết kế để giúp bạn hoàn thành tác vụ rồi tiếp tục công việc, trong khi dữ liệu nhạy cảm vẫn nằm dưới quyền kiểm soát của bạn.",
      principles: [
        { title: "Local-first", text: "Input nhạy cảm được xử lý trong bộ nhớ trình duyệt khi tác vụ có thể hoàn thành ngay trên thiết bị." },
        { title: "Minh bạch mặc định", text: "Mỗi công cụ giải thích dữ liệu được dùng, kết quả trả về và giới hạn thực tế." },
        { title: "Ít ma sát hơn", text: "Không cần tài khoản, vault hay onboarding để sử dụng bộ công cụ." },
        { title: "Đúng kỳ vọng", text: "Decode không phải verify, hashing không phải encryption và thời gian crack chỉ là ước tính." }
      ]
    },
    flow: {
      eyebrow: "SFRANKEY HOẠT ĐỘNG THẾ NÀO",
      title: "Đường ngắn nhất từ input đến kết quả.",
      description: "Phần lớn công cụ đi theo một đường local đơn giản. Trình duyệt nhận input, chạy logic và trả kết quả mà không upload giá trị nhạy cảm.",
      steps: [
        { label: "Input người dùng", text: "Secret, mật khẩu, token, ảnh, file hoặc giá trị lập trình." },
        { label: "Bộ nhớ trình duyệt", text: "Logic công cụ chạy cục bộ trong lúc trang đang mở." },
        { label: "Kết quả cục bộ", text: "Sao chép, kiểm tra, tải xuống hoặc đặt lại khi xong." },
        { label: "Giải phóng state", text: "Đặt lại hoặc rời trang sẽ xóa state nhạy cảm đang xử lý." }
      ],
      networkTitle: "Ranh giới rõ ràng cho chẩn đoán mạng",
      networkText: "Công cụ trên thiết bị giữ input nhạy cảm trong bộ nhớ trình duyệt. Chẩn đoán mạng chỉ kết nối sau khi bạn chủ động chọn thao tác và luôn nêu rõ nơi nhận request.",
      networkItems: ["Đồng bộ thời gian chỉ trả timestamp", "Network check nêu rõ API, provider hoặc website đích"],
      localLabel: "Đường xử lý cục bộ",
      networkLabel: "Đường network tùy chọn",
      inputLabel: "Input",
      memoryLabel: "Bộ nhớ trình duyệt",
      resultLabel: "Kết quả",
      noUpload: "Không upload",
      noSecretApi: "Không gửi secret lên API",
      ariaLabel: "Sơ đồ cho thấy input đi qua bộ nhớ trình duyệt để tạo kết quả cục bộ",
      matrix: { headers: ["Dữ liệu", "Xử lý", "Network"], rows: [["Secret, mật khẩu, JWT, JSON", "Bộ nhớ trình duyệt", "Không gửi"], ["Ảnh QR và checksum file", "Trên thiết bị", "Không upload"], ["Mục tiêu chẩn đoán mạng", "Chỉ sau thao tác của bạn", "API, provider hoặc website được nêu rõ"], ["Feedback", "Chỉ trường bạn submit", "Chủ động gửi"]] }
    },
    ecosystem: {
      eyebrow: "HỆ SINH THÁI CÔNG CỤ",
      title: "Một hệ công cụ nhỏ cho công việc hằng ngày.",
      description: "Hệ công cụ gồm tiện ích cục bộ và chẩn đoán mạng chủ động, có sẵn bằng tiếng Việt và tiếng Anh. Bản đồ bên dưới lấy từ cùng registry dùng cho menu, tìm kiếm và catalog.",
      toolCount: "công cụ",
      categoryCount: "nhóm",
      languageCount: "ngôn ngữ",
      openCategory: "Khám phá nhóm",
      sampleMore: "công cụ khác"
    },
    technical: {
      eyebrow: "BÊN DƯỚI GIAO DIỆN",
      title: "Một chút công nghệ, dùng đúng mức.",
      description: "Chi tiết triển khai quan trọng vì chúng hỗ trợ lời hứa cốt lõi: dữ liệu nhạy cảm được giữ gần người đang dùng công cụ.",
      capabilities: [
        { title: "Web Crypto", text: "Mật khẩu và UUID dùng nguồn ngẫu nhiên bảo mật của trình duyệt." },
        { title: "Phân tích offline", text: "Bộ phân tích độ mạnh và wordlist chạy cục bộ; mật khẩu không được gửi đi tra cứu." },
        { title: "Bộ nhớ trình duyệt", text: "Giá trị nhạy cảm không đi vào URL, tùy chọn, cookie hoặc event analytics." },
        { title: "API boundary rõ ràng", text: "API phục vụ health, đồng bộ thời gian, feedback và chẩn đoán network có disclosure rõ ràng." }
      ]
    },
    limits: {
      eyebrow: "GIỚI HẠN RÕ RÀNG",
      title: "Quyền riêng tư cũng cần kỳ vọng trung thực.",
      description: "Một công cụ local vẫn có thể không phù hợp cho một tác vụ. Chúng tôi làm rõ ranh giới để bạn dễ tin vào kết quả hơn.",
      items: [
        { title: "JWT Decoder chỉ giải mã", text: "Nó không xác minh chữ ký token và không chứng minh token đáng tin." },
        { title: "Encoding không phải encryption", text: "Base64 chỉ đổi biểu diễn, còn hash tạo digest; cả hai không che dữ liệu như encryption." },
        { title: "Thời gian crack là ước tính", text: "Kết quả phụ thuộc phần cứng, rate limit, thuật toán và mô hình tấn công." },
        { title: "Kiểm tra link QR trước", text: "QR Reader hiển thị nội dung trước khi mở link để bạn tự quyết định có tin hay không." },
        { title: "Không thay thế bảo mật chuyên nghiệp", text: "SFranKey hỗ trợ quy trình, nhưng không thay thế password manager, audit hoặc chuyên gia bảo mật." }
      ],
      privacyLink: "Đọc mô hình quyền riêng tư",
      securityLink: "Đọc baseline bảo mật"
    },
    cta: {
      eyebrow: "SẴN SÀNG KHI BẠN CẦN",
      title: "Dùng công cụ hữu ích mà không giao dữ liệu cho một hộp đen.",
      text: "Bắt đầu với một công cụ local-first, quan sát cách nó hoạt động và giữ quyền kiểm soát với mọi giá trị bạn đưa vào workspace.",
      primary: "Khám phá công cụ",
      secondary: "Đề xuất công cụ",
      trust: "Không tài khoản · Không upload input nhạy cảm · VI/EN"
    }
  }
} as const;

export const dictionaries = {
  en: {
    ...toolDetailsDictionaries.en,
    ...qrSuiteDictionaries.en,
    ...developerSuiteDictionaries.en,
    ...networkSuiteDictionaries.en,
    brandDescriptor: "Security & Developer Tools",
    tagline: "Private-first tools for security and development.",
    nav: { tools: "All tools", categories: "Categories", about: "About", privacy: "Privacy", security: "Security", request: "Request a tool" },
    ui: { skip: "Skip", menu: "Open menu", close: "Close", openSearch: "Open search", theme: "Theme", system: "System", light: "Light", dark: "Dark", favorites: "Favorites", recent: "Recently used", viewAll: "View all", localOnly: "Runs locally", onDeviceTools: "on-device tools", networkTools: "network-required tools", networkBoundary: "Network checks run only after your action", noAccount: "No account", language: "Language", breadcrumb: "Breadcrumb", searchHint: "Search by tool, category or keyword", searchRecent: "Jump back in", searchFavorites: "Your favorites", noFavorites: "Favorite tools will appear here.", clearSearch: "Clear search", splashDescriptor: "Private security toolbox", splashSkip: "Skip intro", footerLocal: "Local and explicit network diagnostics", footerTools: "Tools", footerProject: "Project", footerFeedback: "Feedback", popular: "Popular tools", categoryExplore: "Explore by category", privacyPromise: "Your data stays yours", privacyPromiseText: "On-device tools keep sensitive values in your browser. Network diagnostics disclose their data boundary and run only after your action.", statsTools: "tools", statsLanguages: "languages", statsAccount: "account required", requestCta: "Missing a tool?", requestCtaText: "Tell us what would make your workflow safer and faster.", requestCtaAction: "Request a tool", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites", sort: "Sort", sortPopular: "Popular first", sortAZ: "A–Z", allCategories: "All categories", filterCategory: "Filter category", searchCatalog: "Search all tools", openTool: "Open tool", openRelated: "Open related tool", localFirst: "Privacy-aware toolbox", toolsAvailable: "Tools available", noAccountRequired: "No account required", sensitiveLocal: "Sensitive values stay on-device for local tools", privacyNoUpload: "No hidden upload", privacyNoPersistence: "No persistence", privacyNoAnalytics: "No sensitive analytics", flowInput: "User input", flowMemory: "Browser memory", flowResult: "Local result", resetFilters: "Reset filters" },
    home: { eyebrow: "SFranKey Tools", title: "Useful tools. Private by default.", titlePrefix: "Useful tools.", typing: ["Private by default.", "Runs locally.", "No sign-in.", "Fast, clear, secure."], description: "A focused toolbox for 2FA, passwords, QR codes, hashing and everyday development tasks. Sensitive values stay in your browser.", cta: "Explore tools", featured: "Popular tools", why: "Built with privacy in mind", whyText: "On-device tools do not upload your secrets, passwords, tokens or files. Every tool explains what happens to your data.", preview: { terminalLabel: "SFranKey workspace", localLabel: "Local", mode: "Local mode", status: "Ready", overview: "Overview", privacy: "Privacy", output: "Output", signal: "Session protected", input: "User input", memory: "Browser memory", result: "Local result", noUpload: "No upload", noAccount: "No account", memoryOnly: "Memory only" } },
    about: aboutDictionaries.en,
    common: { search: "Search tools", copy: "Copy", copied: "Copied", reset: "Reset", download: "Download", clear: "Clear", generate: "Generate", invalid: "Please check the value and try again.", onDevice: "Processed on this device", networkRequired: "Network connection required", noResults: "No tools found.", loading: "Loading…", error: "Something went wrong." },
    categories: { "2fa": "2FA & OTP", password: "Passwords", qr: "QR Code", encoding: "Encoding & Hashing", developer: "Developer", network: "Network intelligence" },
    tool: { guide: "How it works", guideText: "Enter data in the workspace, review the output, then use copy or download. Processing happens directly in your browser.", privacy: "Privacy", privacyText: "Tool data is not uploaded to the server, added to the URL or stored in local preferences.", faq: "FAQ", faqText: "Sensitive inputs stay in browser memory and are cleared when you leave or reset the tool.", related: "Related tools", noVerification: "Decoding does not verify a token.", noEncryption: "Encoding and hashing are not encryption." },
    password: {
      generator: {
        title: "Generate private passwords",
        modes: { characters: "Random password", passphrase: "Passphrase" },
        length: "Length",
        wordCount: "Words",
        batchCount: "Number of results",
        uppercase: "Uppercase",
        lowercase: "Lowercase",
        numbers: "Numbers",
        symbols: "Symbols",
        excludeAmbiguous: "Exclude ambiguous characters",
        noRepeat: "No repeated characters",
        separator: "Separator",
        separatorSpace: "Space",
        separatorDash: "Hyphen",
        separatorUnderscore: "Underscore",
        separatorDot: "Dot",
        capitalizeWords: "Capitalize each word",
        generate: "Generate",
        copyAll: "Copy all",
        download: "Download TXT",
        downloadWarning: "This downloads the results as plaintext. Continue?",
        reveal: "Show results",
        hide: "Hide results",
        entropy: "Estimated randomness",
        bits: "bits",
        shortLengthWarning: "Lengths below 12 characters may offer less protection, but are available for systems with shorter limits.",
        belowRecommended: "Four or five words are easier to type, but six or more words are recommended for stronger protection.",
        privacy: "Results are generated with browser cryptography and stay in memory. They are not sent or saved.",
        noResults: "Generate a result to see it here.",
        errors: { invalidLength: "Choose a length from 4 to 128.", noCharacterSet: "Select at least one character set.", impossibleNoRepeat: "The selected pool is too small for this length without repeats.", invalidBatch: "Choose between 1 and 50 results.", invalidWordCount: "Choose between 4 and 10 words.", invalidSeparator: "Choose a supported separator.", fallback: "Could not generate a result. Check the settings and try again." }
      },
      checker: {
        title: "Check password strength locally",
        passwordLabel: "Password",
        placeholder: "Type a password to analyze",
        showPassword: "Show password",
        hidePassword: "Hide password",
        clear: "Clear password",
        loading: "Loading local analyzer…",
        scoreLabel: "Strength",
        scoreNames: ["Very weak", "Weak", "Fair", "Strong", "Very strong"],
        guesses: "Estimated guesses",
        onlineThrottled: "Online attack (throttled)",
        offlineSlowHashing: "Offline attack (slow hashing)",
        estimateNote: "Crack-time estimates are approximate and depend on the attacker’s hardware, rate limits and hash algorithm.",
        privacy: "The password is analyzed in this browser only. It is never stored, sent to an API or included in analytics.",
        empty: "Enter a password to see a local assessment.",
        tooLong: "Use 512 characters or fewer.",
        fallback: "The local analyzer could not process this value."
      }
    },
    twoFactor: { title: "Two-factor authenticator", tabs: { secret: "Enter secret", uri: "Paste setup URI", scan: "Scan QR" }, secretLabel: "2FA secret (Base32)", secretPlaceholder: "JBSWY3DPEHPK3PXP", uriLabel: "otpauth:// setup URI", uriPlaceholder: "otpauth://totp/Example:account?secret=...", showSecret: "Show secret", hideSecret: "Hide secret", algorithm: "Algorithm", digits: "Digits", period: "Code period", seconds: "seconds", advancedOptions: "Advanced settings", hideAdvanced: "Hide advanced settings", scanUpload: "Upload image", scanDrop: "Drop a QR image here", scanCamera: "Use camera", stopCamera: "Stop camera", scanPasteHint: "You can also paste a QR image from the clipboard.", decoded: "Scanned setup URI", metadata: "Configuration", issuer: "Issuer", account: "Account", currentCode: "Current code", expiresIn: "Changes in", updated: "Updated", reset: "Reset", syncNow: "Sync clock", clockSyncing: "Syncing clock…", clockSynced: "Clock synchronized", clockFallback: "Using device clock", clockSkew: "Your device clock differs from the server clock. The code may be inaccurate.", privacy: "The secret, setup URI and QR image stay in this browser. They are not stored, added to the URL or sent to the API.", errors: { invalidSecret: "Enter a valid Base32 secret.", invalidUri: "Enter a valid otpauth:// TOTP setup URI.", hotpUnsupported: "HOTP is recognized, but this workspace currently supports TOTP only.", qrMustBeTotp: "This QR code is not a TOTP setup QR code.", imageTooLarge: "The QR image must be smaller than 10 MB.", imageType: "Use a PNG, JPEG or WebP image.", noQr: "No QR code was found in this image.", camera: "Camera permission was not available." } },
    feedback: { bugTitle: "Report a bug", requestTitle: "Request a tool", subject: "Subject", message: "Message", email: "Email (optional)", submit: "Send", success: "Thanks — your message was sent.", failure: "Could not send the message. Please try again." }
  },
  vi: {
    ...toolDetailsDictionaries.vi,
    ...qrSuiteDictionaries.vi,
    ...developerSuiteDictionaries.vi,
    ...networkSuiteDictionaries.vi,
    brandDescriptor: "Công cụ Bảo mật & Lập trình",
    tagline: "Bộ công cụ bảo mật và lập trình ưu tiên quyền riêng tư.",
    nav: { tools: "Tất cả công cụ", categories: "Danh mục", about: "Giới thiệu", privacy: "Quyền riêng tư", security: "Bảo mật", request: "Đề xuất công cụ" },
    ui: { skip: "Bỏ qua", menu: "Mở menu", close: "Đóng", openSearch: "Mở tìm kiếm", theme: "Giao diện", system: "Theo hệ thống", light: "Sáng", dark: "Tối", favorites: "Yêu thích", recent: "Đã dùng gần đây", viewAll: "Xem tất cả", localOnly: "Xử lý cục bộ", onDeviceTools: "công cụ trên thiết bị", networkTools: "công cụ cần mạng", networkBoundary: "Kiểm tra mạng chỉ chạy sau thao tác của bạn", noAccount: "Không cần tài khoản", language: "Ngôn ngữ", breadcrumb: "Điều hướng đường dẫn", searchHint: "Tìm theo công cụ, danh mục hoặc từ khóa", searchRecent: "Mở lại nhanh", searchFavorites: "Công cụ yêu thích", noFavorites: "Công cụ yêu thích sẽ xuất hiện ở đây.", clearSearch: "Xóa tìm kiếm", splashDescriptor: "Hộp công cụ bảo mật riêng tư", splashSkip: "Bỏ qua giới thiệu", footerLocal: "Công cụ cục bộ và chẩn đoán mạng chủ động", footerTools: "Công cụ", footerProject: "Dự án", footerFeedback: "Phản hồi", popular: "Công cụ phổ biến", categoryExplore: "Khám phá theo danh mục", privacyPromise: "Dữ liệu thuộc về bạn", privacyPromiseText: "Công cụ trên thiết bị giữ dữ liệu nhạy cảm trong trình duyệt. Công cụ mạng công khai ranh giới dữ liệu và chỉ chạy sau thao tác của bạn.", statsTools: "công cụ", statsLanguages: "ngôn ngữ", statsAccount: "yêu cầu tài khoản", requestCta: "Thiếu công cụ?", requestCtaText: "Hãy cho chúng tôi biết điều gì giúp quy trình của bạn an toàn và nhanh hơn.", requestCtaAction: "Đề xuất công cụ", addFavorite: "Thêm vào yêu thích", removeFavorite: "Bỏ khỏi yêu thích", sort: "Sắp xếp", sortPopular: "Phổ biến trước", sortAZ: "A–Z", allCategories: "Tất cả danh mục", filterCategory: "Lọc danh mục", searchCatalog: "Tìm trong tất cả công cụ", openTool: "Mở công cụ", openRelated: "Mở công cụ liên quan", localFirst: "Hệ công cụ tôn trọng quyền riêng tư", toolsAvailable: "Công cụ khả dụng", noAccountRequired: "Không cần tài khoản", sensitiveLocal: "Dữ liệu nhạy cảm ở trên thiết bị với công cụ cục bộ", privacyNoUpload: "Không upload ngầm", privacyNoPersistence: "Không lưu trữ", privacyNoAnalytics: "Không analytics dữ liệu nhạy cảm", flowInput: "Input người dùng", flowMemory: "Bộ nhớ trình duyệt", flowResult: "Kết quả cục bộ", resetFilters: "Đặt lại bộ lọc" },
    home: { eyebrow: "SFranKey Tools", title: "Công cụ hữu ích. Riêng tư mặc định.", titlePrefix: "Công cụ hữu ích.", typing: ["Riêng tư mặc định.", "Xử lý cục bộ.", "Không đăng nhập.", "Nhanh, rõ, an toàn."], description: "Bộ công cụ tập trung cho 2FA, mật khẩu, QR, hash và các tác vụ lập trình hằng ngày. Dữ liệu nhạy cảm ở lại trong trình duyệt.", cta: "Khám phá công cụ", featured: "Công cụ phổ biến", why: "Thiết kế với quyền riêng tư", whyText: "Công cụ trên thiết bị không tải secret, mật khẩu, token hay file của bạn lên server. Mỗi công cụ giải thích rõ dữ liệu được xử lý thế nào.", preview: { terminalLabel: "SFranKey workspace", localLabel: "Cục bộ", mode: "Chế độ cục bộ", status: "Sẵn sàng", overview: "Tổng quan", privacy: "Riêng tư", output: "Kết quả", signal: "Phiên được bảo vệ", input: "Input người dùng", memory: "Bộ nhớ trình duyệt", result: "Kết quả cục bộ", noUpload: "Không upload", noAccount: "Không tài khoản", memoryOnly: "Chỉ bộ nhớ" } },
    about: aboutDictionaries.vi,
    common: { search: "Tìm công cụ", copy: "Sao chép", copied: "Đã sao chép", reset: "Đặt lại", download: "Tải xuống", clear: "Xóa", generate: "Tạo", invalid: "Vui lòng kiểm tra giá trị và thử lại.", onDevice: "Xử lý trên thiết bị này", networkRequired: "Cần kết nối mạng", noResults: "Không tìm thấy công cụ.", loading: "Đang tải…", error: "Đã xảy ra lỗi." },
    categories: { "2fa": "2FA & OTP", password: "Mật khẩu", qr: "Mã QR", encoding: "Mã hóa & Hash", developer: "Lập trình", network: "Mạng & chẩn đoán" },
    tool: { guide: "Cách hoạt động", guideText: "Nhập dữ liệu vào workspace, kiểm tra kết quả rồi dùng nút sao chép hoặc tải xuống. Công cụ xử lý trực tiếp trong trình duyệt.", privacy: "Quyền riêng tư", privacyText: "Dữ liệu công cụ không được tải lên server, đưa vào URL hoặc lưu trong tùy chọn cục bộ.", faq: "FAQ", faqText: "Input nhạy cảm chỉ ở trong bộ nhớ trình duyệt và được xóa khi bạn rời trang hoặc đặt lại công cụ.", related: "Công cụ liên quan", noVerification: "Giải mã không đồng nghĩa với xác minh token.", noEncryption: "Encoding và hashing không phải là mã hóa." },
    password: {
      generator: {
        title: "Tạo mật khẩu riêng tư",
        modes: { characters: "Mật khẩu ngẫu nhiên", passphrase: "Passphrase" },
        length: "Độ dài",
        wordCount: "Số từ",
        batchCount: "Số kết quả",
        uppercase: "Chữ hoa",
        lowercase: "Chữ thường",
        numbers: "Chữ số",
        symbols: "Ký hiệu",
        excludeAmbiguous: "Loại ký tự dễ nhầm",
        noRepeat: "Không lặp ký tự",
        separator: "Dấu phân cách",
        separatorSpace: "Khoảng trắng",
        separatorDash: "Dấu gạch ngang",
        separatorUnderscore: "Gạch dưới",
        separatorDot: "Dấu chấm",
        capitalizeWords: "Viết hoa đầu mỗi từ",
        generate: "Tạo",
        copyAll: "Sao chép tất cả",
        download: "Tải TXT",
        downloadWarning: "Kết quả sẽ được tải xuống dưới dạng plaintext. Bạn muốn tiếp tục?",
        reveal: "Hiện kết quả",
        hide: "Ẩn kết quả",
        entropy: "Độ ngẫu nhiên ước tính",
        bits: "bit",
        shortLengthWarning: "Độ dài dưới 12 ký tự có thể kém an toàn hơn, nhưng vẫn được hỗ trợ cho các hệ thống có giới hạn ngắn.",
        belowRecommended: "Bốn hoặc năm từ dễ nhập hơn, nhưng nên dùng từ sáu từ trở lên để được bảo vệ tốt hơn.",
        privacy: "Kết quả được tạo bằng crypto của trình duyệt và chỉ nằm trong bộ nhớ. Chúng không được gửi hoặc lưu lại.",
        noResults: "Hãy tạo kết quả để xem tại đây.",
        errors: { invalidLength: "Hãy chọn độ dài từ 4 đến 128.", noCharacterSet: "Hãy chọn ít nhất một nhóm ký tự.", impossibleNoRepeat: "Pool ký tự được chọn quá nhỏ để tạo độ dài này mà không lặp.", invalidBatch: "Hãy chọn từ 1 đến 50 kết quả.", invalidWordCount: "Hãy chọn từ 4 đến 10 từ.", invalidSeparator: "Hãy chọn dấu phân cách được hỗ trợ.", fallback: "Không thể tạo kết quả. Hãy kiểm tra lại cấu hình." }
      },
      checker: {
        title: "Kiểm tra độ mạnh mật khẩu cục bộ",
        passwordLabel: "Mật khẩu",
        placeholder: "Nhập mật khẩu để phân tích",
        showPassword: "Hiện mật khẩu",
        hidePassword: "Ẩn mật khẩu",
        clear: "Xóa mật khẩu",
        loading: "Đang tải bộ phân tích cục bộ…",
        scoreLabel: "Độ mạnh",
        scoreNames: ["Rất yếu", "Yếu", "Tạm được", "Mạnh", "Rất mạnh"],
        guesses: "Số lần đoán ước tính",
        onlineThrottled: "Tấn công online (có giới hạn)",
        offlineSlowHashing: "Tấn công offline (hash chậm)",
        estimateNote: "Thời gian bẻ khóa chỉ là ước tính và phụ thuộc phần cứng, giới hạn thử và thuật toán hash của kẻ tấn công.",
        privacy: "Mật khẩu chỉ được phân tích trong trình duyệt này. Nó không được lưu, gửi lên API hoặc đưa vào analytics.",
        empty: "Nhập mật khẩu để xem đánh giá cục bộ.",
        tooLong: "Hãy dùng tối đa 512 ký tự.",
        fallback: "Bộ phân tích cục bộ không thể xử lý giá trị này."
      }
    },
    twoFactor: { title: "Trình xác thực hai lớp", tabs: { secret: "Nhập secret", uri: "Dán URI cài đặt", scan: "Quét QR" }, secretLabel: "Secret 2FA (Base32)", secretPlaceholder: "JBSWY3DPEHPK3PXP", uriLabel: "URI cài đặt otpauth://", uriPlaceholder: "otpauth://totp/Example:account?secret=...", showSecret: "Hiện secret", hideSecret: "Ẩn secret", algorithm: "Thuật toán", digits: "Số chữ số", period: "Chu kỳ mã", seconds: "giây", advancedOptions: "Tùy chọn nâng cao", hideAdvanced: "Ẩn tùy chọn nâng cao", scanUpload: "Tải ảnh lên", scanDrop: "Kéo thả ảnh QR vào đây", scanCamera: "Dùng camera", stopCamera: "Dừng camera", scanPasteHint: "Bạn cũng có thể dán ảnh QR từ clipboard.", decoded: "URI cài đặt đã quét", metadata: "Cấu hình", issuer: "Nhà cung cấp", account: "Tài khoản", currentCode: "Mã hiện tại", expiresIn: "Đổi mã sau", updated: "Cập nhật", reset: "Đặt lại", syncNow: "Đồng bộ đồng hồ", clockSyncing: "Đang đồng bộ đồng hồ…", clockSynced: "Đã đồng bộ đồng hồ", clockFallback: "Đang dùng đồng hồ thiết bị", clockSkew: "Đồng hồ thiết bị khác server. Mã có thể không chính xác.", privacy: "Secret, URI cài đặt và ảnh QR chỉ ở trong trình duyệt. Chúng không được lưu, đưa vào URL hoặc gửi lên API.", errors: { invalidSecret: "Hãy nhập secret Base32 hợp lệ.", invalidUri: "Hãy nhập URI otpauth:// TOTP hợp lệ.", hotpUnsupported: "Đã nhận diện HOTP, nhưng workspace hiện chỉ hỗ trợ TOTP.", qrMustBeTotp: "QR này không phải QR cài đặt TOTP.", imageTooLarge: "Ảnh QR phải nhỏ hơn 10 MB.", imageType: "Hãy dùng ảnh PNG, JPEG hoặc WebP.", noQr: "Không tìm thấy mã QR trong ảnh.", camera: "Không có quyền truy cập camera." } },
    feedback: { bugTitle: "Báo lỗi", requestTitle: "Đề xuất công cụ", subject: "Tiêu đề", message: "Nội dung", email: "Email (không bắt buộc)", submit: "Gửi", success: "Cảm ơn — tin nhắn đã được gửi.", failure: "Không thể gửi tin nhắn. Vui lòng thử lại." }
  }
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
