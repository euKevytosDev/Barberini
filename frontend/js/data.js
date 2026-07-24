/* Barberini — dados e regras de negócio (espelho do app atual) */

window.BARBERINI = {
  estabelecimento: "BARBERINI",
  nomeCompleto: "Barberini Barbearia",
  timezone: "America/Sao_Paulo",

  /** Cancelamento com menos de 1h: taxa 50% + bloqueio até pagar */
  politicaCancelamento: {
    antecedenciaMinutos: 60,
    taxaPercentual: 50,
    texto:
      "Cancelamentos devem ser feitos com pelo menos 1 hora de antecedência. " +
      "Caso contrário, poderá ser cobrada taxa de 50% e o agendamento futuro " +
      "fica bloqueado até o pagamento da taxa.",
  },

  /** Janela de agenda do cliente (como no app) */
  janelaAgendaDias: 30,

  /** Slots de 30 minutos; intervalo de almoço 12:00–13:30 */
  agenda: {
    slotMinutos: 30,
    abertura: "09:00",
    fechamento: "19:00",
    almocoInicio: "12:00",
    almocoFim: "13:30",
    diasFuncionamento: [1, 2, 3, 4, 5, 6], // seg–sáb (0=dom)
  },

  barbeiros: [
    { id: "abner", nome: "Abner Barber", iniciais: "AB", cor: "#3d3d3d" },
    { id: "julio", nome: "Julio César", iniciais: "JC", cor: "#555555" },
    { id: "lucas", nome: "Lucas Barber", iniciais: "LB", cor: "#2a2a2a" },
  ],

  categorias: [{ id: "cabelo", nome: "CABELO" }],

  /** Preços e nomes exatamente como no app do vídeo */
  servicos: [
    { id: "acab-barba", nome: "Acabamento barba", preco: 15, duracao: 15, categoria: "cabelo" },
    { id: "acab-cabelo", nome: "Acabamento cabelo", preco: 15, duracao: 15, categoria: "cabelo" },
    { id: "barboterapia", nome: "Barboterapia", preco: 35, duracao: 30, categoria: "cabelo" },
    { id: "barb-acab", nome: "Barboterapia + acabamento cabelo", preco: 50, duracao: 45, categoria: "cabelo" },
    { id: "barb-sobr", nome: "Barboterapia + sobrancelha", preco: 50, duracao: 40, categoria: "cabelo" },
    { id: "corte", nome: "Corte", preco: 45, duracao: 30, categoria: "cabelo" },
    { id: "corte-acab-barba", nome: "Corte + acabamento barba", preco: 60, duracao: 40, categoria: "cabelo" },
    { id: "corte-acab-sobr", nome: "Corte + acabamento barba + sobrancelha", preco: 75, duracao: 50, categoria: "cabelo" },
    { id: "corte-barb", nome: "Corte + Barboterapia", preco: 80, duracao: 60, categoria: "cabelo" },
    { id: "corte-barb-sel", nome: "Corte + Barboterapia + selagem", preco: 170, duracao: 90, categoria: "cabelo" },
    { id: "corte-sel", nome: "Corte + selagem", preco: 135, duracao: 75, categoria: "cabelo" },
    { id: "corte-sobr", nome: "Corte + sobrancelha", preco: 60, duracao: 40, categoria: "cabelo" },
    { id: "corte-barb-sobr", nome: "Corte + barboterapia + sobrancelha", preco: 95, duracao: 70, categoria: "cabelo" },
    { id: "limpeza", nome: "Limpeza de pele (contra oleosidade)", preco: 20, duracao: 20, categoria: "cabelo" },
    { id: "selagem", nome: "Selagem", preco: 90, duracao: 60, categoria: "cabelo" },
    { id: "sobrancelha", nome: "Sobrancelha", preco: 15, duracao: 15, categoria: "cabelo" },
    { id: "tintura", nome: "Tintura (A partir de)", preco: 40, duracao: 45, categoria: "cabelo" },
  ],
};

window.BARBERINI.utils = {
  dinheiro(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },

  pad2(n) {
    return String(n).padStart(2, "0");
  },

  /** "09:00" → minutos desde meia-noite */
  horaParaMinutos(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  },

  minutosParaHora(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${this.pad2(h)}:${this.pad2(m)}`;
  },

  /** Gera slots livres do dia (respeitando almoço) */
  gerarSlots() {
    const { abertura, fechamento, almocoInicio, almocoFim, slotMinutos } =
      window.BARBERINI.agenda;
    const ini = this.horaParaMinutos(abertura);
    const fim = this.horaParaMinutos(fechamento);
    const aIni = this.horaParaMinutos(almocoInicio);
    const aFim = this.horaParaMinutos(almocoFim);
    const slots = [];
    for (let t = ini; t + slotMinutos <= fim; t += slotMinutos) {
      if (t >= aIni && t < aFim) continue;
      slots.push(this.minutosParaHora(t));
    }
    return slots;
  },

  /** Fim do atendimento a partir do início + duração do serviço */
  fimAtendimento(inicioHhmm, duracaoMin) {
    const slot = window.BARBERINI.agenda.slotMinutos;
    const blocos = Math.max(1, Math.ceil(duracaoMin / slot));
    const fim = this.horaParaMinutos(inicioHhmm) + blocos * slot;
    return this.minutosParaHora(fim);
  },

  formatarDataBR(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  },

  diaSemanaCurto(date) {
    return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][date.getDay()];
  },

  diaSemanaLetra(date) {
    return ["D", "S", "T", "Q", "Q", "S", "S"][date.getDay()];
  },

  mesAno(date) {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return { mes: meses[date.getMonth()], ano: date.getFullYear() };
  },

  toISODate(date) {
    return `${date.getFullYear()}-${this.pad2(date.getMonth() + 1)}-${this.pad2(date.getDate())}`;
  },

  parseISODate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  },

  isMesmoDia(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  },
};
