/* Barberini — app web mobile-first (cara de app no navegador) */

(() => {
  const U = () => window.BARBERINI.utils;
  const B = () => window.BARBERINI;

  /** Estado do fluxo de agendamento */
  const booking = {
    servicos: [], // ids
    data: null, // ISO
    barbeiroId: null,
    hora: null,
    observacao: "",
    semPreferencia: false,
  };

  let calCursor = new Date(); // mês/semana do calendário
  let dataSelecionada = new Date();

  /* ---------- helpers DOM ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function show(el) {
    if (el) el.classList.remove("oculto");
  }
  function hide(el) {
    if (el) el.classList.add("oculto");
  }

  function toast(msg) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("visivel");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("visivel"), 2400);
  }

  /* ---------- auth ---------- */
  function usuarioLogado() {
    return Store.get().usuario;
  }

  function irParaApp() {
    hide($("#tela-login"));
    show($("#tela-app"));
    atualizarHeaderUsuario();
    renderAgenda();
    ativarTab("agenda");
  }

  function irParaLogin() {
    show($("#tela-login"));
    hide($("#tela-app"));
    fecharWizard();
  }

  function atualizarHeaderUsuario() {
    const u = usuarioLogado();
    const el = $("#header-user");
    if (el && u) el.textContent = `Cliente | ${u.nome}`;
  }

  function fazerLogin(nome, email) {
    Store.login({
      nome: (nome || "Cliente").trim(),
      email: (email || "").trim().toLowerCase(),
    });
    irParaApp();
  }

  /* ---------- tabs ---------- */
  function ativarTab(nome) {
    $$(".tab").forEach((t) => t.classList.toggle("ativa", t.dataset.tab === nome));
    $$(".aba-conteudo").forEach((a) =>
      a.classList.toggle("ativa", a.id === `aba-${nome}`)
    );
    const titulos = { agenda: "Agenda", perfil: "Perfil", opcoes: "Opções" };
    const h = $("#titulo-aba");
    if (h) h.textContent = titulos[nome] || "Agenda";
    const fab = $("#btn-agendar");
    if (fab) fab.classList.toggle("oculto", nome !== "agenda");
    if (nome === "agenda") renderAgenda();
    if (nome === "perfil") renderPerfil();
  }

  /* ---------- agenda ---------- */
  function renderAgenda() {
    const lista = $("#lista-agenda");
    const vazia = $("#agenda-vazia");
    const itens = Store.proximos(B().janelaAgendaDias);

    if (!itens.length) {
      show(vazia);
      lista.innerHTML = "";
      return;
    }

    hide(vazia);
    lista.innerHTML = itens
      .map((ag) => {
        const serv = B().servicos.find((s) => s.id === ag.servicoId);
        const barb = B().barbeiros.find((b) => b.id === ag.barbeiroId);
        const d = U().parseISODate(ag.data);
        const dia = U().diaSemanaCurto(d);
        return `
          <article class="card-agendamento" data-id="${ag.id}">
            <div class="card-agendamento-faixa"></div>
            <div class="card-agendamento-corpo">
              <div class="card-agendamento-topo">
                <span>${dia} · ${ag.hora} até ${ag.fim}</span>
                <span>${U().formatarDataBR(ag.data)}</span>
              </div>
              <div class="card-agendamento-info">
                <div class="avatar" style="background:${barb?.cor || "#333"}">${barb?.iniciais || "?"}</div>
                <div>
                  <strong>${barb?.nome || "Barbeiro"}</strong>
                  <p>${serv?.nome || "Serviço"}</p>
                </div>
                <button type="button" class="btn-menu-ag" data-id="${ag.id}" aria-label="Opções do agendamento">⋮</button>
              </div>
            </div>
          </article>`;
      })
      .join("");

    $$(".btn-menu-ag", lista).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirMenuAgendamento(btn.dataset.id);
      });
    });
  }

  function abrirMenuAgendamento(id) {
    const ag = Store.get().agendamentos.find((a) => a.id === id);
    if (!ag) return;
    const ok = confirm(
      `Cancelar agendamento de ${U().formatarDataBR(ag.data)} às ${ag.hora}?\n\n` +
        B().politicaCancelamento.texto
    );
    if (ok) {
      Store.removeAgendamento(id);
      toast("Agendamento cancelado");
      renderAgenda();
    }
  }

  /* ---------- perfil ---------- */
  function renderPerfil() {
    const u = usuarioLogado();
    if (!u) return;
    $("#perfil-nome").textContent = u.nome;
    $("#perfil-email").textContent = u.email || "—";
    const total = Store.get().agendamentos.length;
    $("#perfil-total").textContent = String(total);
    const ini = u.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
    const el = $("#perfil-iniciais");
    if (el) el.textContent = ini || "CL";
  }

  /* ---------- wizard agendar ---------- */
  function abrirWizard() {
    booking.servicos = [];
    booking.data = null;
    booking.barbeiroId = null;
    booking.hora = null;
    booking.observacao = "";
    booking.semPreferencia = false;
    dataSelecionada = new Date();
    calCursor = new Date();
    show($("#wizard"));
    irPasso("servicos");
  }

  function fecharWizard() {
    hide($("#wizard"));
  }

  function irPasso(nome) {
    $$(".passo").forEach((p) => p.classList.toggle("ativo", p.dataset.passo === nome));
    if (nome === "servicos") renderServicos();
    if (nome === "profissional") renderProfissional();
    if (nome === "confirmar") renderConfirmar();
  }

  /* --- serviços --- */
  function renderServicos() {
    const busca = ($("#busca-servico")?.value || "").toLowerCase().trim();
    const lista = $("#lista-servicos");
    const filtrados = B().servicos.filter(
      (s) => !busca || s.nome.toLowerCase().includes(busca)
    );

    lista.innerHTML = filtrados
      .map((s) => {
        const on = booking.servicos.includes(s.id);
        return `
          <button type="button" class="linha-servico ${on ? "selecionado" : ""}" data-id="${s.id}">
            <span class="linha-servico-nome">${s.nome}</span>
            <span class="linha-servico-preco">${U().dinheiro(s.preco)}</span>
            <span class="linha-servico-acao" aria-hidden="true">${on ? "✓" : "+"}</span>
          </button>`;
      })
      .join("");

    $$(".linha-servico", lista).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const i = booking.servicos.indexOf(id);
        if (i >= 0) booking.servicos.splice(i, 1);
        else booking.servicos = [id]; // MVP: 1 serviço por vez (como o fluxo do vídeo)
        renderServicos();
        atualizarBtnsServicos();
      });
    });

    atualizarBtnsServicos();
  }

  function atualizarBtnsServicos() {
    const next = $("#btn-servicos-proximo");
    if (next) next.disabled = booking.servicos.length === 0;
  }

  /* --- profissional / data / hora --- */
  function renderProfissional() {
    const serv = B().servicos.find((s) => s.id === booking.servicos[0]);
    $("#chip-servico-nome").textContent = serv?.nome || "—";
    $("#chip-servico-meta").textContent = serv
      ? `${serv.duracao} min · ${U().dinheiro(serv.preco)}`
      : "";

    renderCalendario();
    renderListaBarbeiros();
    atualizarBtnsProf();
  }

  function renderCalendario() {
    const { mes, ano } = U().mesAno(calCursor);
    $("#cal-mes").textContent = mes;
    $("#cal-ano").textContent = String(ano);

    const base = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
    // mostra a semana que contém dataSelecionada, ou a semana atual do mês
    const ref = new Date(dataSelecionada);
    if (
      ref.getMonth() !== calCursor.getMonth() ||
      ref.getFullYear() !== calCursor.getFullYear()
    ) {
      ref.setFullYear(calCursor.getFullYear(), calCursor.getMonth(), 1);
    }

    const domingo = new Date(ref);
    domingo.setDate(ref.getDate() - ref.getDay());

    const dias = $("#cal-dias");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    dias.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(domingo);
      d.setDate(domingo.getDate() + i);
      const iso = U().toISODate(d);
      const selecionado = U().isMesmoDia(d, dataSelecionada);
      const ehHoje = U().isMesmoDia(d, hoje);
      const passado = d < hoje;
      const funciona = B().agenda.diasFuncionamento.includes(d.getDay());

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "cal-dia" +
        (selecionado ? " selecionado" : "") +
        (ehHoje ? " hoje" : "") +
        (passado || !funciona ? " disabled" : "");
      btn.disabled = passado || !funciona;
      btn.innerHTML = `<span>${U().diaSemanaLetra(d)}</span><strong>${d.getDate()}</strong>`;
      btn.addEventListener("click", () => {
        dataSelecionada = d;
        booking.data = iso;
        booking.hora = null;
        booking.barbeiroId = null;
        renderCalendario();
        renderListaBarbeiros();
        atualizarBtnsProf();
      });
      dias.appendChild(btn);
    }

    if (!booking.data) {
      booking.data = U().toISODate(dataSelecionada);
    }
  }

  function slotsDisponiveis(barbeiroId, dataIso, duracaoMin) {
    const todos = U().gerarSlots();
    const ocupados = new Set(Store.ocupados(barbeiroId, dataIso));
    const hojeIso = U().toISODate(new Date());
    const agoraMin =
      dataIso === hojeIso
        ? new Date().getHours() * 60 + new Date().getMinutes()
        : -1;

    const blocos = Math.max(1, Math.ceil(duracaoMin / B().agenda.slotMinutos));

    return todos.filter((hora) => {
      const ini = U().horaParaMinutos(hora);
      if (agoraMin >= 0 && ini <= agoraMin) return false;
      // precisa de N slots livres consecutivos
      for (let i = 0; i < blocos; i++) {
        const h = U().minutosParaHora(ini + i * B().agenda.slotMinutos);
        if (ocupados.has(h)) return false;
        // não atravessar almoço / fechamento
        if (!todos.includes(h) && i > 0) return false;
      }
      return true;
    });
  }

  function renderListaBarbeiros() {
    const box = $("#lista-barbeiros");
    const serv = B().servicos.find((s) => s.id === booking.servicos[0]);
    const duracao = serv?.duracao || 30;
    const dataIso = booking.data || U().toISODate(dataSelecionada);

    const semPref = `
      <button type="button" class="btn-sem-pref ${booking.semPreferencia ? "ativo" : ""}" id="btn-sem-pref">
        SEM PREFERÊNCIA
      </button>`;

    const cards = B()
      .barbeiros.map((b) => {
        const slots = slotsDisponiveis(b.id, dataIso, duracao);
        const slotsHtml = slots.length
          ? slots
              .map((h) => {
                const on =
                  booking.barbeiroId === b.id && booking.hora === h;
                return `<button type="button" class="slot ${on ? "selecionado" : ""}" data-barbeiro="${b.id}" data-hora="${h}">${h}</button>`;
              })
              .join("")
          : `<p class="sem-slot">Sem horários neste dia</p>`;

        return `
          <div class="card-barbeiro">
            <div class="card-barbeiro-topo">
              <div class="avatar" style="background:${b.cor}">${b.iniciais}</div>
              <strong>${b.nome}</strong>
            </div>
            <div class="grade-slots">${slotsHtml}</div>
          </div>`;
      })
      .join("");

    box.innerHTML = semPref + cards;

    $("#btn-sem-pref")?.addEventListener("click", () => {
      booking.semPreferencia = !booking.semPreferencia;
      if (booking.semPreferencia) {
        // aloca o primeiro barbeiro com slot livre
        const primeiro = B().barbeiros.find(
          (b) => slotsDisponiveis(b.id, dataIso, duracao).length
        );
        if (primeiro) {
          const h = slotsDisponiveis(primeiro.id, dataIso, duracao)[0];
          booking.barbeiroId = primeiro.id;
          booking.hora = h;
        }
      } else {
        booking.barbeiroId = null;
        booking.hora = null;
      }
      renderListaBarbeiros();
      atualizarBtnsProf();
    });

    $$(".slot", box).forEach((btn) => {
      btn.addEventListener("click", () => {
        booking.barbeiroId = btn.dataset.barbeiro;
        booking.hora = btn.dataset.hora;
        booking.semPreferencia = false;
        renderListaBarbeiros();
        atualizarBtnsProf();
      });
    });
  }

  function atualizarBtnsProf() {
    const next = $("#btn-prof-proximo");
    if (next) next.disabled = !(booking.barbeiroId && booking.hora && booking.data);
  }

  /* --- confirmar --- */
  function renderConfirmar() {
    const serv = B().servicos.find((s) => s.id === booking.servicos[0]);
    const barb = B().barbeiros.find((b) => b.id === booking.barbeiroId);
    const fim = U().fimAtendimento(booking.hora, serv?.duracao || 30);

    $("#conf-data").textContent = U().formatarDataBR(booking.data);
    $("#conf-estab").textContent = B().estabelecimento;
    $("#conf-barbeiro").textContent = barb?.nome || "—";
    $("#conf-servico").textContent = serv?.nome || "—";
    $("#conf-horario").textContent = `${booking.hora} até ${fim}`;
    $("#conf-avatar").textContent = barb?.iniciais || "?";
    $("#conf-avatar").style.background = barb?.cor || "#333";
    $("#conf-politica").textContent = B().politicaCancelamento.texto;
    $("#conf-obs").value = booking.observacao || "";
  }

  function confirmarAgendamento() {
    const serv = B().servicos.find((s) => s.id === booking.servicos[0]);
    if (!serv || !booking.barbeiroId || !booking.hora || !booking.data) {
      toast("Complete o agendamento");
      return;
    }
    const fim = U().fimAtendimento(booking.hora, serv.duracao);
    booking.observacao = $("#conf-obs")?.value?.trim() || "";

    Store.addAgendamento({
      servicoId: serv.id,
      barbeiroId: booking.barbeiroId,
      data: booking.data,
      hora: booking.hora,
      fim,
      observacao: booking.observacao,
    });

    fecharWizard();
    ativarTab("agenda");
    toast("Agendamento confirmado!");
  }

  /* ---------- boot ---------- */
  function bind() {
    // login
    $("#form-login")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = $("#login-nome").value;
      const email = $("#login-email").value;
      if (!nome.trim()) {
        toast("Informe seu nome");
        return;
      }
      fazerLogin(nome, email);
    });

    $("#btn-login-demo")?.addEventListener("click", () => {
      fazerLogin("Raian Kevin", "raiankevin18@gmail.com");
    });

    // tabs
    $$(".tab").forEach((t) =>
      t.addEventListener("click", () => ativarTab(t.dataset.tab))
    );

    // agendar
    $("#btn-agendar")?.addEventListener("click", abrirWizard);
    $$(".btn-fechar-wizard").forEach((b) =>
      b.addEventListener("click", fecharWizard)
    );

    // serviços
    $("#busca-servico")?.addEventListener("input", renderServicos);
    $("#btn-servicos-voltar")?.addEventListener("click", fecharWizard);
    $("#btn-servicos-proximo")?.addEventListener("click", () => {
      if (!booking.servicos.length) return;
      irPasso("profissional");
    });
    $("#btn-remover-servico")?.addEventListener("click", () => {
      booking.servicos = [];
      irPasso("servicos");
    });

    // calendário
    $("#cal-prev")?.addEventListener("click", () => {
      calCursor.setMonth(calCursor.getMonth() - 1);
      renderCalendario();
      renderListaBarbeiros();
    });
    $("#cal-next")?.addEventListener("click", () => {
      calCursor.setMonth(calCursor.getMonth() + 1);
      renderCalendario();
      renderListaBarbeiros();
    });
    $("#cal-hoje")?.addEventListener("click", () => {
      const hoje = new Date();
      calCursor = new Date(hoje);
      dataSelecionada = new Date(hoje);
      booking.data = U().toISODate(hoje);
      booking.hora = null;
      booking.barbeiroId = null;
      renderCalendario();
      renderListaBarbeiros();
      atualizarBtnsProf();
    });

    $("#btn-prof-voltar")?.addEventListener("click", () => irPasso("servicos"));
    $("#btn-prof-proximo")?.addEventListener("click", () => {
      if (!(booking.barbeiroId && booking.hora)) return;
      irPasso("confirmar");
    });

    $("#btn-conf-cancelar")?.addEventListener("click", fecharWizard);
    $("#btn-conf-agendar")?.addEventListener("click", confirmarAgendamento);

    // opções
    $("#btn-sair")?.addEventListener("click", () => {
      if (confirm("Deseja sair?")) {
        Store.logout();
        irParaLogin();
      }
    });

    $("#btn-relatar")?.addEventListener("click", () => {
      toast("Obrigado! Em breve abriremos o canal de suporte.");
    });
  }

  function init() {
    bind();
    const u = usuarioLogado();
    if (u) irParaApp();
    else irParaLogin();

    // splash
    const splash = $("#splash");
    if (splash) {
      const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => {
        splash.classList.add("splash-sair");
        setTimeout(() => splash.remove(), 420);
      }, reduzido ? 300 : 1600);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
