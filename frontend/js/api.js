/* API Barberini — localhost no IntelliJ, Pages em produção */

window.API = (() => {
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:";

  const BASE = isLocal
    ? "http://localhost:8080"
    : (localStorage.getItem("barberini_api_url") || "http://localhost:8080");

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
      const err = new Error("Servidor offline. Suba o backend no IntelliJ (porta 8080).");
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
