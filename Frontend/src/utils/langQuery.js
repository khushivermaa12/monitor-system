export function getLangFromUrl(defaultLang = "en") {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get("lang");
  if (urlLang) return urlLang;

  const storedLang = localStorage.getItem("preferredLang");
  if (storedLang) return storedLang;

  return defaultLang;
}

export function setLangAndReload(lang) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  localStorage.setItem("preferredLang", lang);
  window.location.href = url.toString();
}
