/* Persistência local (MVP — depois vira API) */

window.Store = (() => {
  const KEY = "barberini_v1";

  const padrao = () => ({
    usuario: null, // { nome, email }
    agendamentos: [], // { id, servicoId, barbeiroId, data, hora, fim, observacao, criadoEm }
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

  return {
    get() {
      return ler();
    },

    login(usuario) {
      return atualizar((s) => {
        s.usuario = usuario;
        return s;
      });
    },

    logout() {
      return atualizar((s) => {
        s.usuario = null;
        return s;
      });
    },

    addAgendamento(ag) {
      return atualizar((s) => {
        s.agendamentos.push({
          ...ag,
          id: "ag_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          criadoEm: new Date().toISOString(),
        });
        return s;
      });
    },

    removeAgendamento(id) {
      return atualizar((s) => {
        s.agendamentos = s.agendamentos.filter((a) => a.id !== id);
        return s;
      });
    },

    /** Agendamentos nos próximos N dias (próximos + hoje) */
    proximos(dias) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + dias);
      return ler()
        .agendamentos
        .filter((a) => {
          const d = window.BARBERINI.utils.parseISODate(a.data);
          return d >= hoje && d <= limite;
        })
        .sort((a, b) => {
          const ka = a.data + a.hora;
          const kb = b.data + b.hora;
          return ka.localeCompare(kb);
        });
    },

    /** Horários já ocupados por barbeiro numa data */
    ocupados(barbeiroId, dataIso) {
      return ler()
        .agendamentos
        .filter((a) => a.barbeiroId === barbeiroId && a.data === dataIso)
        .map((a) => a.hora);
    },
  };
})();
