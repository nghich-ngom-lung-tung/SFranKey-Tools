# Password tools

SFranKey generates character passwords and passphrases entirely in the browser. Character passwords use `crypto.getRandomValues()` with rejection sampling. Passphrases use the EFF Large Wordlist (7,776 words), bundled offline and selected with the same browser CSPRNG.

The EFF list is sourced from [eff_large_wordlist.txt](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt). EFF's current guidance recommends at least six words from a list of this size. The list is redistributed with attribution under the [CC BY 4.0 terms described in EFF's copyright policy](https://www.eff.org/copyright).

The strength checker uses the pinned `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common` and `@zxcvbn-ts/language-en` packages. The analyzer is loaded only when the checker receives a value and does not make network requests.

Downloaded results are plaintext files. SFranKey does not store generated values or checked passwords in localStorage, cookies, URLs, logs, API requests or analytics events.
