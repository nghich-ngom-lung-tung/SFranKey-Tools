(function () {
  try {
    const preferences = JSON.parse(localStorage.getItem("sfrankey-preferences") || "null");
    const theme = preferences && preferences.theme || "system";
    const dark = theme === "dark" || theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();
