/* Persistência local + cache de catálogo + rascunho de agendamento */

window.Store = (() => {
  const KEY = "barberini_v2";
  const KEY_DRAFT = "barberini_draft";
  const KEY_CATALOG = "barberini_catalog";
  const KEY_SLOTS = "barberini_slots_cache";

  const padrao = () => ({
    usuario: null, // { id, nome, email, papel, demo? }
    agendamentos: [],
  });

  function ler() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return padrao();
      return { ...padrao(), ...JSON.parse(raw) };
    } catch {
      return padrao();
    }
  }

  function salvar(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function atualizar(fn) {
    const state = ler();
    const next = fn(state) || state;
    salvar(next);
    return next;
  }

  function normServico(s) {
    return {
      id: Number(s.id),
      nome: s.nome,
      preco: Number(s.preco),
      duracaoMin: Number(s.duracaoMin ?? s.duracao ?? 30),
      ativo: s.ativo !== false,
    };
  }

  function normBarbeiro(b) {
    return {
      id: Number(b.id),
      nome: b.nome,
      iniciais: b.iniciais,
      cor: b.cor || "#3d3d3d",
      ativo: b.ativo !== false,
    };
  }

  function fallbackCatalogo() {
    const B = window.BARBERINI;
    return {
      barbeiros: B.barbeiros.map((b, i) =>
        normBarbeiro({ ...b, id: i + 1, ativo: true })
      ),
      servicos: B.servicos.map((s, i) =>
        normServico({ ...s, id: i + 1, duracaoMin: s.duracao, ativo: true })
      ),
      offline: true,
      atualizadoEm: null,
    };
  }

  function lerCatalogo() {
    try {
      const raw = localStorage.getItem(KEY_CATALOG);
      if (!raw) return null;
      const c = JSON.parse(raw);
      return {
        barbeiros: (c.barbeiros || []).map(normBarbeiro),
        servicos: (c.servicos || []).map(normServico),
        offline: !!c.offline,
        atualizadoEm: c.atualizadoEm || null,
      };
    } catch {
      return null;
    }
  }

  function salvarCatalogo(barbeiros, servicos, offline = false) {
    const payload = {
      barbeiros: barbeiros.map(normBarbeiro),
      servicos: servicos.map(normServico),
      offline,
      atualizadoEm: new Date().toISOString(),
    };
    localStorage.setItem(KEY_CATALOG, JSON.stringify(payload));
    return payload;
  }

  function catalogoAtual() {
    const cached = lerCatalogo();
    if (cached && cached.barbeiros.length) return cached;
    return fallbackCatalogo();
  }

  function slotsCacheKey(barbeiroId, data, servicoId) {
    return `${barbeiroId}|${data}|${servicoId || ""}`;
  }

  function lerSlotsCache(key) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY_SLOTS) || "{}");
      return all[key] || null;
    } catch {
      return null;
    }
  }

  function salvarSlotsCache(key, slots) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY_SLOTS) || "{}");
      all[key] = { slots, em: Date.now() };
      const keys = Object.keys(all);
      if (keys.length > 80) {
        keys.sort((a, b) => (all[a].em || 0) - (all[b].em || 0));
        keys.slice(0, keys.length - 60).forEach((k) => delete all[k]);
      }
      localStorage.setItem(KEY_SLOTS, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }

  /** Invalida cache de slots (ex.: após o dono bloquear/liberar horário). */
  function limparSlotsCache(barbeiroId, data) {
    try {
      if (barbeiroId == null && !data) {
        localStorage.removeItem(KEY_SLOTS);
        return;
      }
      const all = JSON.parse(localStorage.getItem(KEY_SLOTS) || "{}");
      Object.keys(all).forEach((k) => {
        const [bid, d] = k.split("|");
        if (barbeiroId != null && Number(bid) !== Number(barbeiroId)) return;
        if (data && d !== data) return;
        delete all[k];
      });
      localStorage.setItem(KEY_SLOTS, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }

  function slotsFallback(barbeiroId, dataIso, duracaoMin, bloqueios = []) {
    const U = window.BARBERINI.utils;
    const B = window.BARBERINI;
    const todos = U.gerarSlots();
    const ocupados = new Set(
      ler()
        .agendamentos.filter(
          (a) => Number(a.barbeiroId) === Number(barbeiroId) && a.data === dataIso
        )
        .map((a) => (a.hora || "").substring(0, 5))
    );
    (bloqueios || []).forEach((bl) => {
      const doBarbeiro =
        bl.barbeiroId == null || Number(bl.barbeiroId) === Number(barbeiroId);
      if (doBarbeiro) ocupados.add(String(bl.hora || "").substring(0, 5));
    });
    const hojeIso = U.toISODate(new Date());
    const agoraMin =
      dataIso === hojeIso
        ? new Date().getHours() * 60 + new Date().getMinutes()
        : -1;
    const blocos = Math.max(1, Math.ceil(duracaoMin / B.agenda.slotMinutos));

    return todos.filter((hora) => {
      const ini = U.horaParaMinutos(hora);
      if (agoraMin >= 0 && ini <= agoraMin) return false;
      for (let i = 0; i < blocos; i++) {
        const h = U.minutosParaHora(ini + i * B.agenda.slotMinutos);
        if (ocupados.has(h)) return false;
        if (!todos.includes(h) && i > 0) return false;
      }
      return true;
    });
  }

  return {
    get() {
      return ler();
    },

    getUsuario() {
      return ler().usuario;
    },

    isDono() {
      const u = ler().usuario;
      return u && u.papel === "DONO";
    },

    temAuthReal() {
      return !!window.API.token();
    },

    async loginApi(email, senha) {
      const data = await window.API.post("/api/auth/login", { email, senha });
      window.API.setToken(data.token);
      const usuario = { ...data.usuario, demo: false };
      atualizar((s) => {
        s.usuario = usuario;
        return s;
      });
      return usuario;
    },

    async loginGoogle(credential) {
      const data = await window.API.post("/api/auth/google", { credential });
      window.API.setToken(data.token);
      const usuario = { ...data.usuario, demo: false };
      atualizar((s) => {
        s.usuario = usuario;
        return s;
      });
      return usuario;
    },

    async cadastroApi(nome, email, senha) {
      const data = await window.API.post("/api/auth/cadastro", { nome, email, senha });
      window.API.setToken(data.token);
      const usuario = { ...data.usuario, demo: false };
      atualizar((s) => {
        s.usuario = usuario;
        return s;
      });
      return usuario;
    },

    loginDemo(nome, email) {
      const usuario = {
        id: null,
        nome: (nome || "Cliente").trim(),
        email: (email || "demo@local").trim().toLowerCase(),
        papel: "CLIENTE",
        demo: true,
      };
      window.API.setToken(null);
      return atualizar((s) => {
        s.usuario = usuario;
        return s;
      }).usuario;
    },

    logout() {
      window.API.setToken(null);
      return atualizar((s) => {
        s.usuario = null;
        return s;
      });
    },

    getDraft() {
      try {
        const raw = localStorage.getItem(KEY_DRAFT);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    saveDraft(draft) {
      localStorage.setItem(KEY_DRAFT, JSON.stringify(draft));
    },

    clearDraft() {
      localStorage.removeItem(KEY_DRAFT);
    },

    async syncCatalogo() {
      try {
        const [barbeiros, servicos] = await Promise.all([
          window.API.get("/api/public/barbeiros"),
          window.API.get("/api/public/servicos"),
        ]);
        return salvarCatalogo(barbeiros, servicos, false);
      } catch (e) {
        const cached = lerCatalogo();
        if (cached && cached.barbeiros.length) {
          return { ...cached, offline: true };
        }
        return salvarCatalogo(
          fallbackCatalogo().barbeiros,
          fallbackCatalogo().servicos,
          true
        );
      }
    },

    getBarbeiros(soAtivos = true) {
      const list = catalogoAtual().barbeiros;
      return soAtivos ? list.filter((b) => b.ativo) : list;
    },

    getServicos(soAtivos = true) {
      const list = catalogoAtual().servicos;
      return soAtivos ? list.filter((s) => s.ativo) : list;
    },

    getBarbeiro(id) {
      return this.getBarbeiros(false).find((b) => Number(b.id) === Number(id));
    },

    getServico(id) {
      return this.getServicos(false).find((s) => Number(s.id) === Number(id));
    },

    catalogoOffline() {
      return catalogoAtual().offline === true;
    },

    async fetchSlots(barbeiroId, data, servicoId) {
      const serv = servicoId ? this.getServico(servicoId) : null;
      const duracaoMin = serv?.duracaoMin || 30;
      const key = slotsCacheKey(barbeiroId, data, servicoId);

      try {
        const q = new URLSearchParams({
          barbeiroId: String(barbeiroId),
          data,
        });
        if (servicoId) q.set("servicoId", String(servicoId));
        // bust cache do browser/proxy — bloqueios mudam o resultado
        q.set("_", String(Date.now()));
        const res = await window.API.get(`/api/public/slots?${q}`);
        const slots = (res.slots || []).map((h) => String(h).substring(0, 5));
        salvarSlotsCache(key, slots);
        return slots;
      } catch (e) {
        // Cache só se for bem recente (evita horário bloqueado continuar aparecendo)
        const cached = lerSlotsCache(key);
        if (cached && cached.slots && Date.now() - (cached.em || 0) < 10000) {
          return cached.slots;
        }
        let bloqueios = [];
        try {
          bloqueios = await window.API.get(`/api/public/bloqueios?data=${encodeURIComponent(data)}`);
        } catch {
          /* offline total */
        }
        return slotsFallback(barbeiroId, data, duracaoMin, bloqueios);
      }
    },

    normAgendamento(ag) {
      return {
        id: ag.id,
        servicoId: Number(ag.servicoId),
        barbeiroId: Number(ag.barbeiroId),
        data: ag.data,
        hora: (ag.hora || ag.horaInicio || "").substring(0, 5),
        fim: (ag.fim || ag.horaFim || "").substring(0, 5),
        observacao: ag.observacao || "",
        servicoNome: ag.servicoNome,
        barbeiroNome: ag.barbeiroNome,
        barbeiroIniciais: ag.barbeiroIniciais,
        barbeiroCor: ag.barbeiroCor,
        clienteNome: ag.clienteNome,
        criadoEm: ag.criadoEm || new Date().toISOString(),
        status: ag.status || "CONFIRMADO",
        semPreferencia: !!ag.semPreferencia,
      };
    },

    addAgendamento(ag) {
      const norm = this.normAgendamento(ag);
      return atualizar((s) => {
        const exists = s.agendamentos.some((a) => Number(a.id) === Number(norm.id));
        if (!exists) s.agendamentos.push(norm);
        return s;
      });
    },

    removeAgendamentoLocal(id) {
      return atualizar((s) => {
        s.agendamentos = s.agendamentos.filter((a) => String(a.id) !== String(id));
        return s;
      });
    },

    async cancelarAgendamento(id) {
      if (window.API.token()) {
        await window.API.del(`/api/agendamentos/${id}`);
      }
      return this.removeAgendamentoLocal(id);
    },

    async syncMeusAgendamentos() {
      if (!window.API.token()) return ler().agendamentos;
      try {
        const lista = await window.API.get("/api/agendamentos/meus");
        const norm = lista.map((a) => this.normAgendamento(a));
        return atualizar((s) => {
          const ids = new Set(norm.map((a) => String(a.id)));
          const locais = s.agendamentos.filter((a) => !ids.has(String(a.id)));
          s.agendamentos = [...norm, ...locais].sort((a, b) =>
            (a.data + a.hora).localeCompare(b.data + b.hora)
          );
          return s;
        }).agendamentos;
      } catch {
        return ler().agendamentos;
      }
    },

    proximos(dias) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + dias);
      return ler()
        .agendamentos.filter((a) => {
          if (a.status === "CANCELADO") return false;
          const d = window.BARBERINI.utils.parseISODate(a.data);
          return d >= hoje && d <= limite;
        })
        .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    },

    /* --- Painel do dono --- */

    async donoAgendamentos(dias = 30) {
      return window.API.get(`/api/dono/agendamentos?dias=${dias}`);
    },

    async donoReatribuirBarbeiro(id, barbeiroId) {
      return window.API.put(`/api/dono/agendamentos/${id}/barbeiro`, {
        barbeiroId: Number(barbeiroId),
      });
    },

    async donoBarbeiros() {
      return window.API.get("/api/dono/barbeiros");
    },

    async donoCriarBarbeiro(body) {
      return window.API.post("/api/dono/barbeiros", body);
    },

    async donoAtualizarBarbeiro(id, body) {
      return window.API.put(`/api/dono/barbeiros/${id}`, body);
    },

    async donoServicos() {
      return window.API.get("/api/dono/servicos");
    },

    async donoCriarServico(body) {
      return window.API.post("/api/dono/servicos", body);
    },

    async donoAtualizarServico(id, body) {
      return window.API.put(`/api/dono/servicos/${id}`, body);
    },

    async donoBloqueios(data) {
      return window.API.get(`/api/dono/bloqueios?data=${data}`);
    },

    async donoCriarBloqueio(body) {
      const res = await window.API.post("/api/dono/bloqueios", body);
      limparSlotsCache(body.barbeiroId, body.data);
      return res;
    },

    async donoRemoverBloqueio(id, meta = {}) {
      const res = await window.API.del(`/api/dono/bloqueios/${id}`);
      limparSlotsCache(meta.barbeiroId, meta.data);
      return res;
    },
  };
})();
