/* Barberini — app web mobile-first com sync na confirmação */

(() => {
  const U = () => window.BARBERINI.utils;
  const B = () => window.BARBERINI;

  const booking = {
    path: null,
    servicoId: null,
    barbeiroId: null,
    data: null,
    hora: null,
    observacao: "",
    semPreferencia: false,
  };

  let calCursor = new Date();
  let dataSelecionada = new Date();
  let ultimoAgendamento = null;
  let painelSecao = "agendamentos";

  /** Painel: desativar horários (UI estilo agenda do cliente) */
  let bloqueioBarbeiroId = null;
  let bloqueioDataSel = new Date();
  let bloqueioCalCursor = new Date();
  let bloqueiosDoDia = []; // cache da data selecionada

  const GOOGLE_CLIENT_ID =
    "868389533637-d3l4a0mrnnbf7i1h34cd0mts996sb6pc.apps.googleusercontent.com";
  let googlePronto = false;

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
    t._timer = setTimeout(() => t.classList.remove("visivel"), 2800);
  }

  function salvarDraft() {
    Store.saveDraft({ ...booking });
  }

  function restaurarDraft() {
    const d = Store.getDraft();
    if (!d) return;
    Object.assign(booking, d);
  }

  function resetBooking() {
    booking.path = null;
    booking.servicoId = null;
    booking.barbeiroId = null;
    booking.data = null;
    booking.hora = null;
    booking.observacao = "";
    booking.semPreferencia = false;
    dataSelecionada = new Date();
    calCursor = new Date();
    Store.clearDraft();
  }

  function horaApi(hhmm) {
    const h = (hhmm || "").substring(0, 5);
    return h.length === 5 ? h + ":00" : h;
  }

  function googleCalendarUrl(ag) {
    const serv = Store.getServico(ag.servicoId);
    const barb = Store.getBarbeiro(ag.barbeiroId);
    const titulo = encodeURIComponent(
      `${serv?.nome || "Serviço"} — ${B().estabelecimento}`
    );
    const detalhes = encodeURIComponent(
      `Barbeiro: ${barb?.nome || ag.barbeiroNome || ""}\n` +
        (ag.observacao ? `Obs: ${ag.observacao}\n` : "") +
        B().politicaCancelamento.texto
    );
    const [y, m, d] = ag.data.split("-");
    const [hi, mi] = ag.hora.substring(0, 5).split(":");
    const fim = ag.fim || U().fimAtendimento(ag.hora, serv?.duracaoMin || 30);
    const [hf, mf] = fim.substring(0, 5).split(":");
    const start = `${y}${m}${d}T${hi}${mi}00`;
    const end = `${y}${m}${d}T${hf}${mf}00`;
    return (
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${titulo}&dates=${start}/${end}&details=${detalhes}`
    );
  }

  /* ---------- auth ---------- */

  function usuarioLogado() {
    return Store.getUsuario();
  }

  async function entrarApp() {
    hide($("#tela-login"));
    show($("#tela-app"));
    atualizarHeaderUsuario();
    atualizarNavDono();
    await Store.syncCatalogo();
    if (Store.temAuthReal()) {
      try {
        await Store.syncMeusAgendamentos();
      } catch {
        /* local ok */
      }
    }
    renderAgenda();
    ativarTab("agenda");
  }

  function irParaLogin() {
    show($("#tela-login"));
    hide($("#tela-app"));
    fecharWizard();
    initGoogleSignIn();
  }

  function atualizarHeaderUsuario() {
    const u = usuarioLogado();
    const el = $("#header-user");
    if (!el || !u) return;
    const papel = u.papel === "DONO" ? "Dono" : "Cliente";
    el.textContent = `${papel} | ${u.nome}`;
  }

  function atualizarNavDono() {
    const tab = $("#tab-painel");
    const btnOpcoes = $("#btn-painel-opcoes");
    const dono = Store.isDono();
    if (tab) tab.classList.toggle("oculto", !dono);
    if (btnOpcoes) btnOpcoes.classList.toggle("oculto", !dono);
  }

  function alternarModoAuth(cadastro) {
    $("#bloco-login")?.classList.toggle("oculto", cadastro);
    $("#bloco-cadastro")?.classList.toggle("oculto", !cadastro);
    $("#auth-titulo").textContent = cadastro ? "Criar conta" : "Entrar";
  }

  /* ---------- tabs ---------- */

  function ativarTab(nome) {
    $$(".tab").forEach((t) => t.classList.toggle("ativa", t.dataset.tab === nome));
    $$(".aba-conteudo").forEach((a) =>
      a.classList.toggle("ativa", a.id === `aba-${nome}`)
    );
    const titulos = {
      agenda: "Agenda",
      perfil: "Perfil",
      opcoes: "Opções",
      painel: "Painel",
    };
    const h = $("#titulo-aba");
    if (h) h.textContent = titulos[nome] || "Agenda";
    const fab = $("#btn-agendar");
    if (fab) fab.classList.toggle("oculto", nome !== "agenda");
    if (nome === "agenda") renderAgenda();
    if (nome === "perfil") renderPerfil();
    if (nome === "painel") renderPainel();
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
        const serv = Store.getServico(ag.servicoId);
        const barb = Store.getBarbeiro(ag.barbeiroId);
        const d = U().parseISODate(ag.data);
        const dia = U().diaSemanaCurto(d);
        const fim = ag.fim || U().fimAtendimento(ag.hora, serv?.duracaoMin || 30);
        return `
          <article class="card-agendamento" data-id="${ag.id}">
            <div class="card-agendamento-faixa"></div>
            <div class="card-agendamento-corpo">
              <div class="card-agendamento-topo">
                <span>${dia} · ${ag.hora} até ${fim}</span>
                <span>${U().formatarDataBR(ag.data)}</span>
              </div>
              <div class="card-agendamento-info">
                <div class="avatar" style="background:${barb?.cor || ag.barbeiroCor || "#333"}">${barb?.iniciais || ag.barbeiroIniciais || "?"}</div>
                <div>
                  <strong>${barb?.nome || ag.barbeiroNome || "Barbeiro"}</strong>
                  <p>${serv?.nome || ag.servicoNome || "Serviço"}</p>
                </div>
                <button type="button" class="btn-menu-ag" data-id="${ag.id}" aria-label="Opções">⋮</button>
              </div>
            </div>
          </article>`;
      })
      .join("");

    $$(".btn-menu-ag", lista).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        cancelarAgendamento(btn.dataset.id);
      });
    });
  }

  async function cancelarAgendamento(id) {
    const ag = Store.get().agendamentos.find((a) => String(a.id) === String(id));
    if (!ag) return;
    const ok = confirm(
      `Cancelar agendamento de ${U().formatarDataBR(ag.data)} às ${ag.hora}?\n\n` +
        B().politicaCancelamento.texto
    );
    if (!ok) return;
    try {
      await Store.cancelarAgendamento(id);
      toast("Agendamento cancelado");
      renderAgenda();
    } catch (e) {
      toast(e.message || "Erro ao cancelar");
    }
  }

  /* ---------- perfil ---------- */

  function renderPerfil() {
    const u = usuarioLogado();
    if (!u) return;
    $("#perfil-nome").textContent = u.nome;
    $("#perfil-email").textContent = u.email || "—";
    const total = Store.get().agendamentos.filter((a) => a.status !== "CANCELADO").length;
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
    const badge = $("#perfil-papel");
    if (badge) {
      badge.textContent = u.papel === "DONO" ? "Dono" : u.demo ? "Demo (local)" : "Cliente";
      badge.classList.toggle("dono", u.papel === "DONO");
    }
  }

  /* ---------- wizard ---------- */

  function abrirWizard() {
    resetBooking();
    show($("#wizard"));
    irPasso("escolha");
  }

  function fecharWizard() {
    hide($("#wizard"));
    resetBooking();
  }

  function voltarPasso() {
    const { path } = booking;
    const ativo = $(".passo.ativo")?.dataset.passo;
    if (ativo === "escolha") fecharWizard();
    else if (ativo === "servicos") irPasso(path === "profissional" ? "barbeiro" : "escolha");
    else if (ativo === "barbeiro") irPasso("escolha");
    else if (ativo === "profissional") irPasso(path === "profissional" ? "servicos" : "servicos");
    else if (ativo === "confirmar") irPasso("profissional");
    else if (ativo === "sucesso") fecharWizard();
    else fecharWizard();
  }

  function irPasso(nome) {
    $$(".passo").forEach((p) => p.classList.toggle("ativo", p.dataset.passo === nome));
    salvarDraft();

    if (nome === "escolha") renderEscolha();
    if (nome === "servicos") renderServicos();
    if (nome === "barbeiro") renderBarbeiroPick();
    if (nome === "profissional") renderProfissional();
    if (nome === "confirmar") renderConfirmar();
    if (nome === "sucesso") renderSucesso();

    const voltar = $("#btn-wizard-voltar");
    const proximo = $("#btn-wizard-proximo");
    const agendar = $("#btn-wizard-agendar");
    hide(voltar);
    hide(proximo);
    hide(agendar);

    if (nome === "escolha") show(voltar);
    else if (nome === "servicos") {
      show(voltar);
      show(proximo);
      proximo.textContent = "Próximo";
    } else if (nome === "barbeiro") {
      show(voltar);
      show(proximo);
      proximo.textContent = "Próximo";
    } else if (nome === "profissional") {
      show(voltar);
      show(proximo);
      proximo.textContent = "Próximo";
    } else if (nome === "confirmar") {
      show(voltar);
      show(agendar);
    } else if (nome === "sucesso") {
      hide($("#wizard-footer"));
    }

    if (nome !== "sucesso") show($("#wizard-footer"));
  }

  function renderEscolha() {
    /* estático no HTML */
  }

  function renderServicos() {
    const busca = ($("#busca-servico")?.value || "").toLowerCase().trim();
    const lista = $("#lista-servicos");
    const filtrados = Store.getServicos().filter(
      (s) => !busca || s.nome.toLowerCase().includes(busca)
    );

    if (Store.catalogoOffline()) {
      $("#aviso-offline")?.classList.remove("oculto");
    } else {
      $("#aviso-offline")?.classList.add("oculto");
    }

    lista.innerHTML = filtrados.length
      ? filtrados
          .map((s) => {
            const on = Number(booking.servicoId) === Number(s.id);
            return `
              <button type="button" class="linha-servico ${on ? "selecionado" : ""}" data-id="${s.id}">
                <span class="linha-servico-nome">${s.nome}</span>
                <span class="linha-servico-meta">${s.duracaoMin} min</span>
                <span class="linha-servico-preco">${U().dinheiro(s.preco)}</span>
                <span class="linha-servico-acao" aria-hidden="true">${on ? "✓" : "+"}</span>
              </button>`;
          })
          .join("")
      : `<p class="lista-vazia">Nenhum serviço disponível</p>`;

    $$(".linha-servico", lista).forEach((btn) => {
      btn.addEventListener("click", () => {
        booking.servicoId = Number(btn.dataset.id);
        booking.hora = null;
        salvarDraft();
        renderServicos();
        atualizarBtnProximo();
      });
    });

    const chip = $("#chip-barbeiro-wizard");
    if (chip) {
      if (booking.path === "profissional" && booking.barbeiroId) {
        const b = Store.getBarbeiro(booking.barbeiroId);
        chip.classList.remove("oculto");
        $("#chip-barbeiro-nome").textContent = b?.nome || "—";
        $("#chip-barbeiro-iniciais").textContent = b?.iniciais || "?";
        $("#chip-barbeiro-iniciais").style.background = b?.cor || "#333";
      } else {
        chip.classList.add("oculto");
      }
    }

    atualizarBtnProximo();
  }

  function renderBarbeiroPick() {
    const lista = $("#lista-barbeiro-pick");
    const barbeiros = Store.getBarbeiros();
    lista.innerHTML = barbeiros
      .map((b) => {
        const on = Number(booking.barbeiroId) === Number(b.id);
        return `
          <button type="button" class="card-pick-barbeiro ${on ? "selecionado" : ""}" data-id="${b.id}">
            <div class="avatar" style="background:${b.cor}">${b.iniciais}</div>
            <strong>${b.nome}</strong>
            ${on ? '<span class="pick-check">✓</span>' : ""}
          </button>`;
      })
      .join("");

    $$(".card-pick-barbeiro", lista).forEach((btn) => {
      btn.addEventListener("click", () => {
        booking.barbeiroId = Number(btn.dataset.id);
        booking.hora = null;
        booking.data = null;
        booking.semPreferencia = false;
        salvarDraft();
        renderBarbeiroPick();
        atualizarBtnProximo();
      });
    });
    atualizarBtnProximo();
  }

  function renderCalendario() {
    const { mes, ano } = U().mesAno(calCursor);
    $("#cal-mes").textContent = mes;
    $("#cal-ano").textContent = String(ano);

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
      btn.addEventListener("click", async () => {
        dataSelecionada = d;
        booking.data = iso;
        booking.hora = null;
        salvarDraft();
        renderCalendario();
        await renderSlots();
        atualizarBtnProximo();
      });
      dias.appendChild(btn);
    }

    if (!booking.data) {
      booking.data = U().toISODate(dataSelecionada);
    }
  }

  async function renderProfissional() {
    const serv = Store.getServico(booking.servicoId);
    const barb = booking.barbeiroId ? Store.getBarbeiro(booking.barbeiroId) : null;

    $("#chip-servico-nome").textContent = serv?.nome || "—";
    $("#chip-servico-meta").textContent = serv
      ? `${serv.duracaoMin} min · ${U().dinheiro(serv.preco)}`
      : "";

    const chipBarb = $("#chip-barbeiro-prof");
    if (booking.path === "profissional" && barb) {
      chipBarb?.classList.remove("oculto");
      $("#chip-barbeiro-prof-nome").textContent = barb.nome;
    } else {
      chipBarb?.classList.add("oculto");
    }

    renderCalendario();
    await renderSlots();
    atualizarBtnProximo();
  }

  function bindSemPref() {
    $("#btn-sem-pref")?.addEventListener("click", async () => {
      booking.semPreferencia = !booking.semPreferencia;
      booking.barbeiroId = null;
      booking.hora = null;
      salvarDraft();
      await renderSlots();
      atualizarBtnProximo();
    });
  }

  async function renderSlots() {
    const box = $("#lista-barbeiros");
    const dataIso = booking.data || U().toISODate(dataSelecionada);

    box.innerHTML = `<p class="carregando-slots">Carregando horários…</p>`;

    let html = "";
    if (booking.path === "servico") {
      html += `
        <button type="button" class="btn-sem-pref ${booking.semPreferencia ? "ativo" : ""}" id="btn-sem-pref">
          ${booking.semPreferencia ? "✓ SEM PREFERÊNCIA" : "SEM PREFERÊNCIA"}
        </button>`;
    }

    /* Sem preferência: agrega horários livres de todos os profissionais.
       O servidor sorteia o profissional na confirmação (dono pode remanejar). */
    if (booking.path === "servico" && booking.semPreferencia) {
      const horas = new Set();
      for (const b of Store.getBarbeiros()) {
        try {
          (await Store.fetchSlots(b.id, dataIso, booking.servicoId)).forEach((h) =>
            horas.add(h)
          );
        } catch {
          /* ignora barbeiro com erro */
        }
      }
      const ordenadas = [...horas].sort();
      const slotsHtml = ordenadas.length
        ? ordenadas
            .map((h) => {
              const on = booking.hora === h;
              return `<button type="button" class="slot ${on ? "selecionado" : ""}" data-hora="${h}">${h}</button>`;
            })
            .join("")
        : `<p class="sem-slot">Sem horários neste dia</p>`;

      html += `
        <div class="card-barbeiro">
          <div class="card-barbeiro-topo">
            <div class="avatar" style="background:#555">★</div>
            <strong>Qualquer profissional</strong>
          </div>
          <div class="grade-slots">${slotsHtml}</div>
        </div>`;

      box.innerHTML = html;
      bindSemPref();

      $$(".slot", box).forEach((btn) => {
        btn.addEventListener("click", () => {
          booking.hora = btn.dataset.hora;
          booking.barbeiroId = null;
          booking.semPreferencia = true;
          salvarDraft();
          $$(".slot", box).forEach((s) =>
            s.classList.toggle("selecionado", s.dataset.hora === booking.hora)
          );
          atualizarBtnProximo();
        });
      });
      return;
    }

    const barbeiros =
      booking.path === "profissional" && booking.barbeiroId
        ? [Store.getBarbeiro(booking.barbeiroId)].filter(Boolean)
        : Store.getBarbeiros();

    for (const b of barbeiros) {
      let slots = [];
      try {
        slots = await Store.fetchSlots(b.id, dataIso, booking.servicoId);
      } catch {
        slots = [];
      }

      const slotsHtml = slots.length
        ? slots
            .map((h) => {
              const on =
                Number(booking.barbeiroId) === Number(b.id) && booking.hora === h;
              return `<button type="button" class="slot ${on ? "selecionado" : ""}" data-barbeiro="${b.id}" data-hora="${h}">${h}</button>`;
            })
            .join("")
        : `<p class="sem-slot">Sem horários neste dia</p>`;

      html += `
        <div class="card-barbeiro">
          <div class="card-barbeiro-topo">
            <div class="avatar" style="background:${b.cor}">${b.iniciais}</div>
            <strong>${b.nome}</strong>
          </div>
          <div class="grade-slots">${slotsHtml}</div>
        </div>`;
    }

    box.innerHTML = html;
    bindSemPref();

    $$(".slot", box).forEach((btn) => {
      btn.addEventListener("click", () => {
        booking.barbeiroId = Number(btn.dataset.barbeiro);
        booking.hora = btn.dataset.hora;
        booking.semPreferencia = false;
        salvarDraft();
        $$(".slot", box).forEach((s) =>
          s.classList.toggle(
            "selecionado",
            Number(s.dataset.barbeiro) === booking.barbeiroId &&
              s.dataset.hora === booking.hora
          )
        );
        atualizarBtnProximo();
      });
    });
  }

  function horarioDefinido() {
    return !!(
      booking.data &&
      booking.hora &&
      (booking.barbeiroId || booking.semPreferencia)
    );
  }

  function atualizarBtnProximo() {
    const prox = $("#btn-wizard-proximo");
    const agendar = $("#btn-wizard-agendar");
    const ativo = $(".passo.ativo")?.dataset.passo;

    if (prox) {
      if (ativo === "servicos") {
        prox.disabled = !booking.servicoId;
      } else if (ativo === "barbeiro") {
        prox.disabled = !booking.barbeiroId;
      } else if (ativo === "profissional") {
        prox.disabled = !horarioDefinido();
      }
    }

    if (agendar) {
      agendar.disabled = !(booking.servicoId && horarioDefinido());
    }
  }

  function renderConfirmar() {
    const serv = Store.getServico(booking.servicoId);
    const semPref = booking.semPreferencia && !booking.barbeiroId;
    const barb = semPref ? null : Store.getBarbeiro(booking.barbeiroId);
    const fim = U().fimAtendimento(booking.hora, serv?.duracaoMin || 30);

    $("#conf-data").textContent = U().formatarDataBR(booking.data);
    $("#conf-estab").textContent = B().estabelecimento;
    $("#conf-barbeiro").textContent = semPref
      ? "Qualquer profissional"
      : barb?.nome || "—";
    $("#conf-servico").textContent = serv?.nome || "—";
    $("#conf-horario").textContent = `${booking.hora} até ${fim}`;
    $("#conf-avatar").textContent = semPref ? "★" : barb?.iniciais || "?";
    $("#conf-avatar").style.background = semPref ? "#555" : barb?.cor || "#333";
    $("#conf-politica").textContent = B().politicaCancelamento.texto;
    $("#conf-obs").value = booking.observacao || "";

    const aviso = $("#conf-aviso-auth");
    if (aviso) {
      aviso.classList.toggle("oculto", Store.temAuthReal());
    }
  }

  async function confirmarAgendamento() {
    if (!Store.temAuthReal()) {
      toast("Faça login (e-mail ou Google) para confirmar o agendamento");
      return;
    }

    const serv = Store.getServico(booking.servicoId);
    if (!serv || !booking.hora || !booking.data || !(booking.barbeiroId || booking.semPreferencia)) {
      toast("Selecione um horário para agendar");
      return;
    }

    booking.observacao = $("#conf-obs")?.value?.trim() || "";
    const btn = $("#btn-wizard-agendar");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Agendando…";
    }

    try {
      const res = await API.post("/api/agendamentos", {
        barbeiroId: booking.semPreferencia ? null : booking.barbeiroId,
        servicoId: booking.servicoId,
        data: booking.data,
        horaInicio: horaApi(booking.hora),
        observacao: booking.observacao,
        semPreferencia: !!booking.semPreferencia,
      });

      ultimoAgendamento = Store.normAgendamento(res);
      Store.addAgendamento(ultimoAgendamento);
      Store.clearDraft();
      irPasso("sucesso");
      renderAgenda();
    } catch (e) {
      if (e.offline) {
        toast("Servidor offline. Conecte o backend para confirmar.");
      } else {
        toast(e.message || "Erro ao agendar");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Agendar";
      }
    }
  }

  function renderSucesso() {
    const ag = ultimoAgendamento;
    if (!ag) return;
    const serv = Store.getServico(ag.servicoId);
    const barb = Store.getBarbeiro(ag.barbeiroId);
    const fim = ag.fim || U().fimAtendimento(ag.hora, serv?.duracaoMin || 30);

    $("#succ-titulo").textContent = "Agendamento confirmado!";
    $("#succ-detalhe").textContent =
      `${serv?.nome || ag.servicoNome} com ${barb?.nome || ag.barbeiroNome}\n` +
      `${U().formatarDataBR(ag.data)} · ${ag.hora} até ${fim}`;

    const linkCal = $("#btn-google-cal");
    if (linkCal) linkCal.href = googleCalendarUrl(ag);
  }

  function avancarPasso() {
    const ativo = $(".passo.ativo")?.dataset.passo;
    if (ativo === "servicos") {
      irPasso("profissional");
    } else if (ativo === "barbeiro") {
      irPasso("servicos");
    } else if (ativo === "profissional") {
      irPasso("confirmar");
    }
  }

  /* ---------- painel do dono ---------- */

  function renderPainel() {
    renderPainelNav();
    if (painelSecao === "agendamentos") renderPainelAgendamentos();
    if (painelSecao === "barbeiros") renderPainelBarbeiros();
    if (painelSecao === "servicos") renderPainelServicos();
    if (painelSecao === "bloqueios") renderPainelBloqueios();
  }

  function renderPainelNav() {
    $$(".painel-nav-btn").forEach((b) =>
      b.classList.toggle("ativo", b.dataset.secao === painelSecao)
    );
  }

  async function renderPainelAgendamentos() {
    const box = $("#painel-conteudo");
    box.innerHTML = `<p class="carregando-slots">Carregando…</p>`;
    try {
      const lista = await Store.donoAgendamentos(30);
      if (!lista.length) {
        box.innerHTML = `<p class="lista-vazia">Nenhum agendamento nos próximos 30 dias</p>`;
        return;
      }
      const barbeiros = Store.getBarbeiros();
      box.innerHTML = lista
        .map((ag) => {
          const opcoes = barbeiros
            .map(
              (b) =>
                `<option value="${b.id}" ${Number(b.id) === Number(ag.barbeiroId) ? "selected" : ""}>${b.nome}</option>`
            )
            .join("");
          return `
        <article class="card-painel-ag ${ag.semPreferencia ? "sem-pref" : ""}">
          <div class="card-painel-ag-topo">
            <strong>${U().formatarDataBR(ag.data)} · ${ag.hora}</strong>
            <span>${ag.clienteNome || "Cliente"}</span>
          </div>
          <p>${ag.servicoNome} — ${ag.barbeiroNome}</p>
          ${ag.semPreferencia ? `<span class="tag-sem-pref">Encaixe · sem preferência</span>` : ""}
          ${ag.observacao ? `<small>Obs: ${ag.observacao}</small>` : ""}
          <div class="reatribuir">
            <label>Profissional</label>
            <select class="sel-barbeiro" data-id="${ag.id}">${opcoes}</select>
            <button type="button" class="btn-mover" data-id="${ag.id}">Mover</button>
          </div>
        </article>`;
        })
        .join("");

      $$(".btn-mover", box).forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const sel = box.querySelector(`.sel-barbeiro[data-id="${id}"]`);
          if (!sel) return;
          btn.disabled = true;
          const original = btn.textContent;
          btn.textContent = "Movendo…";
          try {
            await Store.donoReatribuirBarbeiro(id, sel.value);
            toast("Profissional atualizado");
            renderPainelAgendamentos();
          } catch (e) {
            toast(e.message || "Erro ao mover");
            btn.disabled = false;
            btn.textContent = original;
          }
        });
      });
    } catch (e) {
      box.innerHTML = `<p class="lista-vazia erro">${e.message || "Erro ao carregar"}</p>`;
    }
  }

  async function renderPainelBarbeiros() {
    const box = $("#painel-conteudo");
    box.innerHTML = `<p class="carregando-slots">Carregando…</p>`;
    try {
      const lista = await Store.donoBarbeiros();
      box.innerHTML = `
        <button type="button" class="btn-painel-add" id="btn-novo-barbeiro">+ Novo barbeiro</button>
        <div id="form-barbeiro" class="form-painel oculto"></div>
        ${lista
          .map(
            (b) => `
          <article class="card-painel-item" data-id="${b.id}">
            <div class="avatar" style="background:${b.cor}">${b.iniciais}</div>
            <div class="card-painel-item-info">
              <strong>${b.nome}</strong>
              <span class="${b.ativo ? "tag-ativo" : "tag-inativo"}">${b.ativo ? "Ativo" : "Inativo"}</span>
            </div>
            <button type="button" class="btn-editar" data-id="${b.id}">Editar</button>
          </article>`
          )
          .join("")}`;
      $("#btn-novo-barbeiro")?.addEventListener("click", () => mostrarFormBarbeiro());
      $$(".btn-editar", box).forEach((btn) => {
        btn.addEventListener("click", () => {
          const b = lista.find((x) => Number(x.id) === Number(btn.dataset.id));
          mostrarFormBarbeiro(b);
        });
      });
    } catch (e) {
      box.innerHTML = `<p class="lista-vazia erro">${e.message || "Erro"}</p>`;
    }
  }

  function mostrarFormBarbeiro(b) {
    const form = $("#form-barbeiro");
    form.classList.remove("oculto");
    form.innerHTML = `
      <h4>${b ? "Editar barbeiro" : "Novo barbeiro"}</h4>
      <label>Nome<input type="text" id="fb-nome" value="${b?.nome || ""}" /></label>
      <label>Iniciais<input type="text" id="fb-iniciais" maxlength="4" value="${b?.iniciais || ""}" /></label>
      <label>Cor<input type="color" id="fb-cor" value="${b?.cor || "#3d3d3d"}" /></label>
      <label class="check-label"><input type="checkbox" id="fb-ativo" ${b?.ativo !== false ? "checked" : ""} /> Ativo</label>
      <div class="form-painel-acoes">
        <button type="button" class="btn btn-outline" id="fb-cancelar">Cancelar</button>
        <button type="button" class="btn btn-solid" id="fb-salvar">Salvar</button>
      </div>`;

    $("#fb-cancelar")?.addEventListener("click", () => form.classList.add("oculto"));
    $("#fb-salvar")?.addEventListener("click", async () => {
      const body = {
        nome: $("#fb-nome").value.trim(),
        iniciais: $("#fb-iniciais").value.trim(),
        cor: $("#fb-cor").value,
        ativo: $("#fb-ativo").checked,
      };
      if (!body.nome) {
        toast("Informe o nome");
        return;
      }
      try {
        if (b) await Store.donoAtualizarBarbeiro(b.id, body);
        else await Store.donoCriarBarbeiro(body);
        await Store.syncCatalogo();
        toast("Barbeiro salvo");
        renderPainelBarbeiros();
      } catch (e) {
        toast(e.message || "Erro");
      }
    });
  }

  async function renderPainelServicos() {
    const box = $("#painel-conteudo");
    box.innerHTML = `<p class="carregando-slots">Carregando…</p>`;
    try {
      const lista = await Store.donoServicos();
      box.innerHTML = `
        <button type="button" class="btn-painel-add" id="btn-novo-servico">+ Novo serviço</button>
        <div id="form-servico" class="form-painel oculto"></div>
        ${lista
          .map(
            (s) => `
          <article class="card-painel-item">
            <div class="card-painel-item-info">
              <strong>${s.nome}</strong>
              <span>${s.duracaoMin} min · ${U().dinheiro(Number(s.preco))}</span>
              <span class="${s.ativo ? "tag-ativo" : "tag-inativo"}">${s.ativo ? "Ativo" : "Inativo"}</span>
            </div>
            <button type="button" class="btn-editar" data-id="${s.id}">Editar</button>
          </article>`
          )
          .join("")}`;
      $("#btn-novo-servico")?.addEventListener("click", () => mostrarFormServico());
      $$(".btn-editar", box).forEach((btn) => {
        btn.addEventListener("click", () => {
          const s = lista.find((x) => Number(x.id) === Number(btn.dataset.id));
          mostrarFormServico(s);
        });
      });
    } catch (e) {
      box.innerHTML = `<p class="lista-vazia erro">${e.message || "Erro"}</p>`;
    }
  }

  function mostrarFormServico(s) {
    const form = $("#form-servico");
    form.classList.remove("oculto");
    form.innerHTML = `
      <h4>${s ? "Editar serviço" : "Novo serviço"}</h4>
      <label>Nome<input type="text" id="fs-nome" value="${s?.nome || ""}" /></label>
      <label>Preço (R$)<input type="number" id="fs-preco" min="0" step="0.01" value="${s?.preco ?? ""}" /></label>
      <label>Duração (min)<input type="number" id="fs-duracao" min="15" step="15" value="${s?.duracaoMin ?? 30}" /></label>
      <label class="check-label"><input type="checkbox" id="fs-ativo" ${s?.ativo !== false ? "checked" : ""} /> Ativo</label>
      <div class="form-painel-acoes">
        <button type="button" class="btn btn-outline" id="fs-cancelar">Cancelar</button>
        <button type="button" class="btn btn-solid" id="fs-salvar">Salvar</button>
      </div>`;

    $("#fs-cancelar")?.addEventListener("click", () => form.classList.add("oculto"));
    $("#fs-salvar")?.addEventListener("click", async () => {
      const body = {
        nome: $("#fs-nome").value.trim(),
        preco: Number($("#fs-preco").value),
        duracaoMin: Number($("#fs-duracao").value),
        ativo: $("#fs-ativo").checked,
      };
      if (!body.nome || body.preco < 0 || body.duracaoMin < 15) {
        toast("Preencha os campos corretamente");
        return;
      }
      try {
        if (s) await Store.donoAtualizarServico(s.id, body);
        else await Store.donoCriarServico(body);
        await Store.syncCatalogo();
        toast("Serviço salvo");
        renderPainelServicos();
      } catch (e) {
        toast(e.message || "Erro");
      }
    });
  }

  async function renderPainelBloqueios() {
    const box = $("#painel-conteudo");
    box.innerHTML = `<p class="carregando-slots">Carregando…</p>`;

    if (!bloqueioBarbeiroId) {
      await renderBloqueioEscolherBarbeiro(box);
      return;
    }
    await renderBloqueioGrade(box);
  }

  async function renderBloqueioEscolherBarbeiro(box) {
    try {
      const lista = await Store.donoBarbeiros();
      const ativos = lista.filter((b) => b.ativo !== false);
      box.innerHTML = `
        <p class="bloqueio-dica">Escolha o profissional para liberar ou bloquear horários. Toque no horário — vermelho = indisponível para o cliente.</p>
        <div class="lista-barbeiros-bloqueio">
          ${ativos
            .map(
              (b) => `
            <button type="button" class="card-barbeiro-pick" data-id="${b.id}">
              <div class="avatar" style="background:${b.cor}">${b.iniciais}</div>
              <strong>${b.nome}</strong>
              <span>Gerenciar horários →</span>
            </button>`
            )
            .join("")}
        </div>`;
      $$(".card-barbeiro-pick", box).forEach((btn) => {
        btn.addEventListener("click", () => {
          bloqueioBarbeiroId = Number(btn.dataset.id);
          bloqueioDataSel = new Date();
          bloqueioCalCursor = new Date();
          renderPainelBloqueios();
        });
      });
    } catch (e) {
      box.innerHTML = `<p class="lista-vazia erro">${e.message || "Erro"}</p>`;
    }
  }

  async function renderBloqueioGrade(box) {
    const barbeiros = Store.getBarbeiros();
    let barb = barbeiros.find((b) => Number(b.id) === Number(bloqueioBarbeiroId));
    if (!barb) {
      try {
        const lista = await Store.donoBarbeiros();
        barb = lista.find((b) => Number(b.id) === Number(bloqueioBarbeiroId));
      } catch (_) {}
    }
    if (!barb) {
      bloqueioBarbeiroId = null;
      return renderPainelBloqueios();
    }

    const { mes, ano } = U().mesAno(bloqueioCalCursor);
    box.innerHTML = `
      <button type="button" class="btn-voltar-barbeiro" id="bl-voltar-barbeiro">← Trocar profissional</button>
      <div class="bloqueio-header-barb">
        <div class="avatar" style="background:${barb.cor}">${barb.iniciais}</div>
        <div>
          <strong>${barb.nome}</strong>
          <span>Toque no horário para bloquear / liberar</span>
        </div>
      </div>
      <div class="cal-wrap bloqueio-cal">
        <div class="cal-topo">
          <button type="button" class="cal-nav" id="bl-cal-prev" aria-label="Semana anterior">‹</button>
          <strong id="bl-cal-mes">${mes}</strong>
          <span class="ano" id="bl-cal-ano">${ano}</span>
          <button type="button" class="cal-nav" id="bl-cal-next" aria-label="Próxima semana">›</button>
          <button type="button" class="btn-hoje" id="bl-cal-hoje">Hoje</button>
        </div>
        <div id="bl-cal-dias" class="cal-dias-row"></div>
      </div>
      <p class="bloqueio-legenda"><span class="leg-livre"></span> Livre <span class="leg-bloq"></span> Bloqueado <span class="leg-ocup"></span> Já agendado</p>
      <div id="bl-grade-slots" class="grade-slots bloqueio-grade">
        <p class="carregando-slots">Carregando horários…</p>
      </div>`;

    $("#bl-voltar-barbeiro")?.addEventListener("click", () => {
      bloqueioBarbeiroId = null;
      renderPainelBloqueios();
    });
    $("#bl-cal-prev")?.addEventListener("click", () => {
      bloqueioDataSel = new Date(bloqueioDataSel);
      bloqueioDataSel.setDate(bloqueioDataSel.getDate() - 7);
      bloqueioCalCursor = new Date(bloqueioDataSel);
      renderPainelBloqueios();
    });
    $("#bl-cal-next")?.addEventListener("click", () => {
      bloqueioDataSel = new Date(bloqueioDataSel);
      bloqueioDataSel.setDate(bloqueioDataSel.getDate() + 7);
      bloqueioCalCursor = new Date(bloqueioDataSel);
      renderPainelBloqueios();
    });
    $("#bl-cal-hoje")?.addEventListener("click", () => {
      bloqueioDataSel = new Date();
      bloqueioCalCursor = new Date();
      renderPainelBloqueios();
    });

    renderBloqueioCalendario();
    await carregarBloqueioSlots();
  }

  function renderBloqueioCalendario() {
    const dias = $("#bl-cal-dias");
    if (!dias) return;
    const { mes, ano } = U().mesAno(bloqueioCalCursor);
    const mesEl = $("#bl-cal-mes");
    const anoEl = $("#bl-cal-ano");
    if (mesEl) mesEl.textContent = mes;
    if (anoEl) anoEl.textContent = String(ano);

    const ref = new Date(bloqueioDataSel);
    const domingo = new Date(ref);
    domingo.setDate(ref.getDate() - ref.getDay());

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    dias.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(domingo);
      d.setDate(domingo.getDate() + i);
      const selecionado = U().isMesmoDia(d, bloqueioDataSel);
      const ehHoje = U().isMesmoDia(d, hoje);
      const funciona = B().agenda.diasFuncionamento.includes(d.getDay());

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "cal-dia" +
        (selecionado ? " selecionado" : "") +
        (ehHoje ? " hoje" : "") +
        (!funciona ? " disabled" : "");
      btn.disabled = !funciona;
      btn.innerHTML = `<span>${U().diaSemanaLetra(d)}</span><strong>${d.getDate()}</strong>`;
      btn.addEventListener("click", () => {
        bloqueioDataSel = d;
        bloqueioCalCursor = new Date(d);
        renderBloqueioCalendario();
        carregarBloqueioSlots();
      });
      dias.appendChild(btn);
    }
  }

  async function carregarBloqueioSlots() {
    const grade = $("#bl-grade-slots");
    if (!grade || !bloqueioBarbeiroId) return;
    const dataIso = U().toISODate(bloqueioDataSel);
    grade.innerHTML = `<p class="carregando-slots">Carregando…</p>`;

    try {
      const [bloqueios, agendaDono] = await Promise.all([
        Store.donoBloqueios(dataIso),
        Store.donoAgendamentos(60).catch(() => []),
      ]);
      bloqueiosDoDia = bloqueios.filter(
        (bl) =>
          bl.barbeiroId == null ||
          Number(bl.barbeiroId) === Number(bloqueioBarbeiroId)
      );

      const ocupados = new Set(
        (agendaDono || [])
          .filter(
            (ag) =>
              ag.data === dataIso &&
              Number(ag.barbeiroId) === Number(bloqueioBarbeiroId)
          )
          .map((ag) => String(ag.hora).slice(0, 5))
      );

      const mapaBloq = new Map();
      bloqueiosDoDia.forEach((bl) => {
        mapaBloq.set(String(bl.hora).slice(0, 5), bl);
      });

      const slots = U().gerarSlots();
      grade.innerHTML = slots
        .map((hora) => {
          const bl = mapaBloq.get(hora);
          const ocupado = ocupados.has(hora);
          if (ocupado) {
            return `<button type="button" class="slot slot-ocupado" disabled title="Já agendado">${hora}</button>`;
          }
          if (bl) {
            return `<button type="button" class="slot slot-bloqueado" data-hora="${hora}" data-id="${bl.id}" title="Clique para liberar">${hora}</button>`;
          }
          return `<button type="button" class="slot slot-livre" data-hora="${hora}" title="Clique para bloquear">${hora}</button>`;
        })
        .join("");

      $$(".slot-livre", grade).forEach((btn) => {
        btn.addEventListener("click", () => toggleBloqueioSlot(btn.dataset.hora, null));
      });
      $$(".slot-bloqueado", grade).forEach((btn) => {
        btn.addEventListener("click", () =>
          toggleBloqueioSlot(btn.dataset.hora, btn.dataset.id)
        );
      });
    } catch (e) {
      grade.innerHTML = `<p class="lista-vazia erro">${e.message || "Erro ao carregar"}</p>`;
    }
  }

  async function toggleBloqueioSlot(hora, bloqueioId) {
    const dataIso = U().toISODate(bloqueioDataSel);
    try {
      if (bloqueioId) {
        await Store.donoRemoverBloqueio(bloqueioId);
        toast(`${hora} liberado`);
      } else {
        await Store.donoCriarBloqueio({
          data: dataIso,
          hora: hora.length === 5 ? hora + ":00" : hora,
          barbeiroId: Number(bloqueioBarbeiroId),
          motivo: "Bloqueado pelo profissional",
        });
        toast(`${hora} bloqueado`);
      }
      await carregarBloqueioSlots();
    } catch (e) {
      toast(e.message || "Erro");
    }
  }

  /* ---------- Google Sign-In ---------- */

  async function handleGoogleCredential(response) {
    try {
      if (!response?.credential) {
        toast("Login Google cancelado");
        return;
      }
      await Store.loginGoogle(response.credential);
      toast("Bem-vindo!");
      await entrarApp();
    } catch (err) {
      toast(err.message || "Erro no login Google");
    }
  }

  function montarBotaoGoogle() {
    const el = $("#google-btn");
    if (!el || !window.google?.accounts?.id) return;
    el.innerHTML = "";
    const largura = Math.min(360, Math.max(240, el.parentElement?.clientWidth || 320));
    google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      width: largura,
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      locale: "pt-BR",
    });
  }

  function initGoogleSignIn(tentativas = 0) {
    if (googlePronto) {
      montarBotaoGoogle();
      return;
    }
    if (!window.google?.accounts?.id) {
      if (tentativas < 40) {
        setTimeout(() => initGoogleSignIn(tentativas + 1), 150);
      }
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    googlePronto = true;
    montarBotaoGoogle();
  }

  /* ---------- boot ---------- */

  function bind() {
    $("#form-login")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#login-email").value.trim();
      const senha = $("#login-senha").value;
      if (!email || !senha) {
        toast("Informe e-mail e senha");
        return;
      }
      try {
        await Store.loginApi(email, senha);
        toast("Bem-vindo!");
        await entrarApp();
      } catch (err) {
        toast(err.message || "Erro no login");
      }
    });

    $("#form-cadastro")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = $("#cad-nome").value.trim();
      const email = $("#cad-email").value.trim();
      const senha = $("#cad-senha").value;
      if (!nome || !email || !senha) {
        toast("Preencha todos os campos");
        return;
      }
      try {
        await Store.cadastroApi(nome, email, senha);
        toast("Conta criada!");
        await entrarApp();
      } catch (err) {
        toast(err.message || "Erro no cadastro");
      }
    });

    $("#btn-auth-cadastro")?.addEventListener("click", () => alternarModoAuth(true));
    $("#btn-auth-login")?.addEventListener("click", () => alternarModoAuth(false));

    $("#btn-login-demo")?.addEventListener("click", async () => {
      try {
        await Store.loginApi("dono@barberini.com", "dono123");
        toast("Entrou como dono (demo API)");
        await entrarApp();
      } catch {
        Store.loginDemo("Cliente Demo", "demo@local");
        toast("Modo demo — login real necessário para agendar");
        await entrarApp();
      }
    });

    $$(".tab").forEach((t) =>
      t.addEventListener("click", () => ativarTab(t.dataset.tab))
    );

    $("#btn-agendar")?.addEventListener("click", abrirWizard);
    $$(".btn-fechar-wizard").forEach((b) =>
      b.addEventListener("click", fecharWizard)
    );

    $$("[data-path]").forEach((btn) => {
      btn.addEventListener("click", () => {
        booking.path = btn.dataset.path;
        salvarDraft();
        if (booking.path === "servico") irPasso("servicos");
        else irPasso("barbeiro");
      });
    });

    $("#busca-servico")?.addEventListener("input", renderServicos);
    $("#btn-wizard-voltar")?.addEventListener("click", voltarPasso);
    $("#btn-wizard-proximo")?.addEventListener("click", avancarPasso);
    $("#btn-wizard-agendar")?.addEventListener("click", confirmarAgendamento);

    $("#btn-remover-servico")?.addEventListener("click", () => {
      booking.servicoId = null;
      irPasso("servicos");
    });

    $("#cal-prev")?.addEventListener("click", async () => {
      calCursor.setMonth(calCursor.getMonth() - 1);
      renderCalendario();
      await renderSlots();
    });
    $("#cal-next")?.addEventListener("click", async () => {
      calCursor.setMonth(calCursor.getMonth() + 1);
      renderCalendario();
      await renderSlots();
    });
    $("#cal-hoje")?.addEventListener("click", async () => {
      const hoje = new Date();
      calCursor = new Date(hoje);
      dataSelecionada = new Date(hoje);
      booking.data = U().toISODate(hoje);
      booking.hora = null;
      salvarDraft();
      renderCalendario();
      await renderSlots();
      atualizarBtnProximo();
    });

    $("#btn-succ-agenda")?.addEventListener("click", () => {
      fecharWizard();
      ativarTab("agenda");
    });

    $("#btn-sair")?.addEventListener("click", () => {
      if (confirm("Deseja sair?")) {
        Store.logout();
        irParaLogin();
      }
    });

    $("#btn-painel-opcoes")?.addEventListener("click", () => ativarTab("painel"));
    $("#btn-relatar")?.addEventListener("click", () => {
      toast("Obrigado! Em breve abriremos o canal de suporte.");
    });

    $$(".painel-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        painelSecao = btn.dataset.secao;
        renderPainel();
      });
    });

    $("#conf-obs")?.addEventListener("input", (e) => {
      booking.observacao = e.target.value;
      salvarDraft();
    });
  }

  async function init() {
    bind();
    restaurarDraft();

    const token = API.token();
    const u = usuarioLogado();
    if (token && u && !u.demo) {
      await entrarApp();
    } else if (u) {
      await entrarApp();
    } else {
      irParaLogin();
    }

    initGoogleSignIn();

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
