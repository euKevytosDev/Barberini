# Barberini Barbearia

App web mobile-first de agendamento — mesma ideia do [Pelada Oficial](https://github.com/euKevytosDev/pelada-oficial): roda no navegador com cara de app de celular.

**Site (GitHub Pages):** https://eukevytosdev.github.io/Barberini/

Frontend conectado ao backend Spring Boot (API REST). O rascunho do agendamento fica no `localStorage`; **só na confirmação final** o horário é enviado ao servidor.

## Como rodar

### Backend (IntelliJ)

1. Abra a pasta `backend/` no IntelliJ IDEA
2. Configure o SDK **Java 17**
3. Execute `BarberiniApplication` (porta **8080**)
4. O H2 em **arquivo** (`backend/data/barberini`) é populado no seed com barbeiros, serviços e o usuário dono (persiste ao reiniciar)

### Frontend

```bash
cd frontend
python3 -m http.server 5173
```

Abra: [http://localhost:5173](http://localhost:5173)

O frontend detecta `localhost` e aponta para `http://localhost:8080`.

## Credenciais do dono (seed)

| Campo | Valor |
|-------|-------|
| E-mail | `dono@barberini.com` |
| Senha | `dono123` |

Com esse login (`papel: DONO`) aparece a aba **Painel** para gerenciar barbeiros, serviços, bloqueios e ver agendamentos.

## Arquitetura sync-on-confirm

| Etapa | Onde fica |
|-------|-----------|
| Navegação do wizard (serviço, barbeiro, data, hora) | `localStorage` (`barberini_draft`) |
| Catálogo (barbeiros, serviços) | Cache local após `GET /api/public/*` |
| Slots disponíveis | `GET /api/public/slots` (fallback local se offline para **navegar**) |
| Confirmação **AGENDAR** | `POST /api/agendamentos` — **obrigatório**; erro claro se offline |
| Após sucesso | Salvo localmente + tela com link Google Calendar |

## O que tem no app

- Login/cadastro com e-mail e senha (`POST /api/auth/login`, `/cadastro`)
- Fluxo **Agendar** com escolha inicial: por serviço ou por profissional
- Agenda dos próximos 30 dias (local + sync `/api/agendamentos/meus`)
- Política de cancelamento (texto em `data.js`)
- Painel do dono: CRUD barbeiros/serviços, bloqueio de horários, lista de agendamentos
- Modo demo (navega offline; confirmação exige login real)

## Estrutura

```text
Barberini/
├── backend/          # Spring Boot API (IntelliJ, Java 17)
├── frontend/
│   ├── index.html
│   ├── css/estilo.css
│   └── js/
│       ├── data.js    # regras, utils, fallback offline
│       ├── api.js     # cliente HTTP + JWT
│       ├── store.js   # localStorage, cache, draft
│       └── app.js     # telas e fluxo
└── README.md
```
