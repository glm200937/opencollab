<div align="center">

# 🧩 OpenCollab

**Plateforme collaborative open source, auto-hébergeable et modulaire**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/YOUR_USERNAME/opencollab/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/opencollab/actions)
[![pnpm](https://img.shields.io/badge/managed%20with-pnpm-orange)](https://pnpm.io)

</div>

---

## ✨ Modules

| Module | Description | Statut |
|--------|-------------|--------|
| 📁 Fichiers | Upload, versioning, partage | 🔧 En cours |
| 📝 Notes | Éditeur collaboratif temps réel (TipTap + Y.js) | 🔧 En cours |
| 💻 Code | Dépôts Git via Gitea intégré | 🔧 En cours |
| 📊 Organisation | Kanban, tâches, calendrier | 🔧 En cours |
| 💬 Chat | Messagerie par workspace | 🔧 En cours |
| 🔐 Sécurité | Auth JWT, rôles, permissions | 🔧 En cours |

---

## 🏗️ Stack technique

```
monorepo (pnpm workspaces)
├── apps/
│   ├── frontend    → React 19 + Vite + TailwindCSS
│   └── backend     → Fastify + Prisma + Socket.io
└── packages/
    └── types       → Types TypeScript partagés
```

**Services self-hosted :** PostgreSQL · Redis · MinIO · Gitea · Caddy

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 20
- pnpm ≥ 9
- Docker + Docker Compose

### 1. Cloner et installer
```bash
git clone https://github.com/YOUR_USERNAME/opencollab.git
cd opencollab
pnpm install
```

### 2. Lancer les services
```bash
docker-compose up -d
```

### 3. Configurer l'environnement
```bash
cp apps/backend/.env.example apps/backend/.env
# Éditez les variables selon votre config
```

### 4. Migrer la base de données
```bash
pnpm --filter @opencollab/backend db:migrate
```

### 5. Lancer en développement
```bash
pnpm dev
```

Frontend : http://localhost:5173  
Backend  : http://localhost:3001  
Gitea    : http://localhost:3000  
MinIO    : http://localhost:9001  

---

## 📦 Roadmap

- **v0.1** — Monorepo, auth, structure de base ← *vous êtes ici*
- **v0.2** — Module fichiers (MinIO) + API REST complète
- **v0.3** — Module notes collaboratives (TipTap + Y.js)
- **v0.4** — Module tâches (Kanban)
- **v0.5** — Module chat (Socket.io)
- **v0.6** — Intégration Gitea
- **v1.0** — Release stable, Docker all-in-one

---

## 📄 Licence

MIT — voir [LICENSE](LICENSE)
