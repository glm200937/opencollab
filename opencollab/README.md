<div align="center">

# 🧩 OpenCollab

**Plateforme collaborative open source, auto-hébergeable et modulaire**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/glm200937/opencollab/actions/workflows/ci.yml/badge.svg)](https://github.com/glm200937/opencollab/actions)
[![pnpm](https://img.shields.io/badge/managed%20with-pnpm-orange)](https://pnpm.io)
[![Version](https://img.shields.io/badge/version-1.0.0-green)](https://github.com/glm200937/opencollab)

</div>

---

## ✨ Modules

| Module | Description | Statut |
|--------|-------------|--------|
| 🔐 Auth | JWT, register, login, refresh token | ✅ v0.2 |
| 📁 Fichiers | Upload MinIO, drag & drop, versioning | ✅ v0.3 |
| 📝 Notes | Éditeur collaboratif temps réel (TipTap + Y.js) | ✅ v0.4 |
| 📋 Tâches | Kanban boards, drag & drop, priorités | ✅ v0.5 |
| 💬 Chat | Messagerie temps réel Socket.io, salons | ✅ v0.6 |

---

## 🏗️ Stack technique

```
monorepo (pnpm workspaces)
├── apps/
│   ├── frontend    → React 19 + Vite + TailwindCSS + TipTap + Socket.io
│   └── backend     → Fastify + Prisma + Socket.io + Y.js WebSocket
└── packages/
    └── types       → Types TypeScript partagés front/back
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
git clone https://github.com/glm200937/opencollab.git
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

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Gitea | http://localhost:3000 |
| MinIO console | http://localhost:9001 |

---

## 📦 Roadmap

- ✅ **v0.1** — Monorepo, structure, docker-compose, Prisma schema
- ✅ **v0.2** — Auth JWT (register, login, refresh)
- ✅ **v0.3** — Module fichiers (MinIO, drag & drop)
- ✅ **v0.4** — Notes collaboratives (TipTap + Y.js)
- ✅ **v0.5** — Tâches Kanban
- ✅ **v0.6 / v1.0** — Chat temps réel (Socket.io)
- 🔜 **v1.1** — Intégration Gitea complète
- 🔜 **v1.2** — Application mobile
- 🔜 **v2.0** — IA intégrée (assistant de projet)

---

## 📄 Licence

MIT — voir [LICENSE](LICENSE)
