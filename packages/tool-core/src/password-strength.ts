import type { TranslationKeys, ZxcvbnFactory, ZxcvbnResult } from "@zxcvbn-ts/core";

export type PasswordStrengthLocale = "en" | "vi";

export type PasswordStrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  guesses: number;
  onlineThrottled: string;
  offlineSlowHashing: string;
  warning?: string;
  suggestions: string[];
};

export const MAX_PASSWORD_LENGTH = 512;

type LanguagePackage = typeof import("@zxcvbn-ts/language-en");
type CommonLanguagePackage = typeof import("@zxcvbn-ts/language-common");

let commonPackagePromise: Promise<CommonLanguagePackage> | undefined;
let englishPackagePromise: Promise<LanguagePackage> | undefined;
const factories = new Map<PasswordStrengthLocale, Promise<ZxcvbnFactory>>();

function loadCommonPackage() {
  commonPackagePromise ??= import("@zxcvbn-ts/language-common");
  return commonPackagePromise;
}

function loadEnglishPackage() {
  englishPackagePromise ??= import("@zxcvbn-ts/language-en");
  return englishPackagePromise;
}

const vietnameseTranslations: TranslationKeys = {
  warnings: {
    straightRow: "Các phím nằm trên một hàng rất dễ đoán.",
    keyPattern: "Mẫu gõ bàn phím ngắn rất dễ đoán.",
    simpleRepeat: "Ký tự lặp như “aaa” rất dễ đoán.",
    extendedRepeat: "Mẫu ký tự lặp như “abcabcabc” rất dễ đoán.",
    sequences: "Chuỗi ký tự phổ biến như “abc” rất dễ đoán.",
    recentYears: "Các năm gần đây rất dễ đoán.",
    dates: "Ngày tháng rất dễ đoán.",
    topTen: "Đây là một mật khẩu được sử dụng rất phổ biến.",
    topHundred: "Đây là một mật khẩu thường được sử dụng.",
    common: "Đây là một mật khẩu phổ biến.",
    similarToCommon: "Mật khẩu này tương tự một mật khẩu phổ biến.",
    wordByItself: "Một từ đơn rất dễ đoán.",
    namesByThemselves: "Một tên hoặc họ đơn rất dễ đoán.",
    commonNames: "Tên và họ phổ biến rất dễ đoán.",
    userInputs: "Không nên dùng dữ liệu cá nhân hoặc dữ liệu liên quan đến trang.",
    pwned: "Mật khẩu này đã xuất hiện trong một vụ rò rỉ dữ liệu trên Internet."
  },
  suggestions: {
    l33t: "Tránh thay thế chữ cái theo quy luật như dùng “@” thay cho “a”.",
    reverseWords: "Tránh viết ngược các từ phổ biến.",
    allUppercase: "Hãy viết hoa một số chữ, nhưng không phải tất cả.",
    capitalization: "Hãy viết hoa nhiều hơn chữ cái đầu tiên.",
    dates: "Tránh ngày tháng và năm có liên quan đến bạn.",
    recentYears: "Tránh các năm gần đây.",
    associatedYears: "Tránh các năm có liên quan đến bạn.",
    sequences: "Tránh các chuỗi ký tự phổ biến.",
    repeated: "Tránh lặp lại từ và ký tự.",
    longerKeyboardPattern: "Dùng mẫu bàn phím dài hơn và thay đổi hướng gõ nhiều lần.",
    anotherWord: "Thêm các từ ít phổ biến hơn.",
    useWords: "Dùng nhiều từ, nhưng tránh các cụm từ phổ biến.",
    noNeed: "Bạn có thể tạo mật khẩu mạnh mà không cần symbol, số hoặc chữ hoa.",
    pwned: "Nếu đang dùng mật khẩu này ở nơi khác, hãy đổi mật khẩu đó."
  },
  timeEstimation: {
    ltSecond: "chưa đến một giây",
    second: "{base} giây",
    seconds: "{base} giây",
    minute: "{base} phút",
    minutes: "{base} phút",
    hour: "{base} giờ",
    hours: "{base} giờ",
    day: "{base} ngày",
    days: "{base} ngày",
    month: "{base} tháng",
    months: "{base} tháng",
    year: "{base} năm",
    years: "{base} năm",
    centuries: "hàng thế kỷ"
  }
};

async function getFactory(locale: PasswordStrengthLocale) {
  const existing = factories.get(locale);
  if (existing) return existing;
  const promise = Promise.all([import("@zxcvbn-ts/core"), loadCommonPackage(), loadEnglishPackage()]).then(([core, common, english]) => {
    return new core.ZxcvbnFactory({
      dictionary: { ...common.dictionary, ...english.dictionary },
      graphs: common.adjacencyGraphs,
      translations: locale === "vi" ? vietnameseTranslations : english.translations
    });
  });
  factories.set(locale, promise);
  return promise;
}

function normalizeResult(result: ZxcvbnResult): PasswordStrengthResult {
  return {
    score: result.score,
    guesses: result.guesses,
    onlineThrottled: result.crackTimes.onlineThrottlingXPerHour.display,
    offlineSlowHashing: result.crackTimes.offlineSlowHashingXPerSecond.display,
    warning: result.feedback.warning ?? undefined,
    suggestions: result.feedback.suggestions
  };
}

export async function assessPassword(password: string, locale: PasswordStrengthLocale = "en"): Promise<PasswordStrengthResult | null> {
  if (!password) return null;
  if (password.length > MAX_PASSWORD_LENGTH) throw new Error("PASSWORD_TOO_LONG");
  const factory = await getFactory(locale);
  return normalizeResult(factory.check(password));
}
