# Barberini Barbearia

App web mobile-first de agendamento — mesma ideia do [Pelada Oficial](https://github.com/eukevytosdev/pelada-oficial): roda no navegador com cara de app de celular.

Espelha o app atual da barbearia (visão do cliente): serviços, preços, 3 barbeiros, slots de 30 min, política de cancelamento.

## Como abrir

```bash
cd frontend
python3 -m http.server 5173
```

Abre no celular ou no Chrome: [http://localhost:5173](http://localhost:5173)

> Dica: no Chrome, F12 → toggle de device (iPhone) pra ver no formato de app.

## O que já tem

- Login simples (nome + e-mail) com demo
- Agenda dos próximos 30 dias
- Fluxo **Agendar**: serviços → profissional/data/hora → confirmação
- 3 barbeiros: Abner, Julio César, Lucas (+ “sem preferência”)
- Serviços e preços do app atual
- Slots 09:00–19:00, intervalo de almoço 12:00–13:30
- Política: cancelar com menos de 1h → taxa 50%
- Dados salvos no `localStorage` (MVP sem backend)

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

- Painel do dono/barbeiro
- Backend + WhatsApp lembrete
- Publicar no GitHub Pages
