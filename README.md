# Barberini Barbearia

App web mobile-first de agendamento — mesma ideia do [Pelada Oficial](https://github.com/euKevytosDev/pelada-oficial): roda no navegador com cara de app de celular.

**Site (GitHub Pages):** https://eukevytosdev.github.io/Barberini/

Espelha o app atual da barbearia (visão do cliente): serviços, preços, 3 barbeiros, slots de 30 min, política de cancelamento.

> Por enquanto **não tem backend**. Tudo fica no `localStorage` do navegador (MVP). O IntelliJ/Spring Boot do Pelada Oficial **não** se aplica aqui ainda.

## Como abrir local

```bash
cd frontend
python3 -m http.server 5173
```

Abre: [http://localhost:5173](http://localhost:5173)

## O que já tem

- Login simples (nome + e-mail) com demo
- Agenda dos próximos 30 dias
- Fluxo **Agendar**: serviços → profissional/data/hora → confirmação
- 3 barbeiros: Abner, Julio César, Lucas (+ “sem preferência”)
- Serviços e preços do app atual
- Slots 09:00–19:00, intervalo de almoço 12:00–13:30
- Política: cancelar com menos de 1h → taxa 50%
- Dados salvos no `localStorage`

## Estrutura

```text
Barberini/
├── frontend/
│   ├── index.html
│   ├── css/estilo.css
│   └── js/
│       ├── data.js    # serviços, barbeiros, regras
│       ├── store.js   # localStorage
│       └── app.js     # telas e fluxo
└── README.md
```

## Próximos passos (quando quiser)

- Backend (API) — aí sim IntelliJ / Spring, tipo o Pelada
- Painel do dono/barbeiro
- WhatsApp lembrete
