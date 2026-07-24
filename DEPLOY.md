# Deploy — Barberini

## Já no ar

| Peça | Onde |
|------|------|
| Front | https://eukevytosdev.github.io/Barberini/ |
| API (após Render) | https://barberini-api.onrender.com |
| Banco | Neon project `barberini` (`icy-surf-10621417`) |

## Neon (já criado)

Projeto: **barberini** · DB: `neondb` · região us-east-2

No Render, use (Connection details → JDBC):

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-fragrant-bread-ay731bvq-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<senha no console Neon / mensagem do Cursor>
```

> A senha não vai no Git. Copie no [console Neon](https://console.neon.tech/app/projects/icy-surf-10621417).

## Render free (Blueprint)

1. Abra https://dashboard.render.com/blueprints  
2. **New Blueprint Instance** → repo `euKevytosDev/Barberini`  
3. Confirme o serviço `barberini-api` (plan free)  
4. Preencha as 3 envs do Neon (`SPRING_DATASOURCE_*`)  
5. Deploy  

Health check: `GET /api/health`

Free do Render **dorme** após ~15 min sem uso — a 1ª request pode demorar ~30–50s.

## Login dono (seed)

- E-mail: `dono@barberini.com`  
- Senha: `dono123`

## Local

- Front: `python3 -m http.server 5173` em `frontend/` → API `localhost:8080`  
- Back: IntelliJ + Java 17 · perfil `local` (H2)
