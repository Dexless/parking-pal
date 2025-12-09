// global language holder
let currentLang: "en" | "es" = "en";

export function getLang() {
  return currentLang;
}

export function setLang(lang: "en" | "es") {
  currentLang = lang;
}
