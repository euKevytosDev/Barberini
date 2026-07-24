/* API Barberini — local IntelliJ / produção Render */

window.API = (() => {
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:";

  /** Produção: GitHub Pages → API no Render */
  const API_BASE_PROD = "https://barberini-api.onrender.com";

  const BASE = isLocal
    ? "http://localhost:8080"
    : localStorage.getItem("barberini_api_url") || API_BASE_PROD;

  function token() {
    return localStorage.getItem("barberini_token") || "";
  }

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const t = token();
    if (t) headers.Authorization = "Bearer " + t;

    let res;
    try {
      res = await fetch(BASE + path, { ...options, headers });
    } catch (e) {
      const msg = isLocal
        ? "Servidor offline. Suba o backend no IntelliJ (porta 8080)."
        : "API offline (Render free pode estar acordando — aguarde ~30s e tente de novo).";
      const err = new Error(msg);
      err.offline = true;
      throw err;
    }

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const err = new Error((data && data.message) || "Erro na API");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    BASE,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    del: (path) => request(path, { method: "DELETE" }),
    setToken(t) {
      if (t) localStorage.setItem("barberini_token", t);
      else localStorage.removeItem("barberini_token");
    },
    token,
  };
})();
