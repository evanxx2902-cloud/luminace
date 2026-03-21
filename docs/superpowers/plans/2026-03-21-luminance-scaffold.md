# Luminance Full-Stack Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete scaffold (no business logic) for the Luminance educational platform: Docker single-container (CentOS 7), Go/Kratos API, React 18 frontend, Python FastAPI AI service, and dual PostgreSQL instances.

**Architecture:** A single CentOS 7 Docker image managed by `tini` + `monit`. Nginx front-ends all traffic (static files + reverse proxy). Go Kratos serves the business API on :8000; Python FastAPI serves the AI API on :8001; two PostgreSQL instances run on :5432 (business) and :5433 (vector). All runtime data lives under `/data` (volume-mounted to `/opt/luminance` on the host).

**Tech Stack:** Docker/CentOS 7, tini, monit, Nginx, Go 1.22 + Kratos v2, React 18 + TypeScript + Vite + Tailwind CSS, Python 3.9 + FastAPI + uvicorn, PostgreSQL 15 × 2 (pgvector on :5433)

---

## Design System (Luminance Educational Platform)

Persist these tokens into Tailwind config and CSS variables before writing any component.

| Token | Value | Notes |
|-------|-------|-------|
| `--color-primary` | `#2563EB` | Blue — links, active states |
| `--color-secondary` | `#3B82F6` | Lighter blue — hover |
| `--color-cta` | `#F97316` | Orange — primary CTA buttons |
| `--color-bg` | `#F8FAFC` | Off-white background |
| `--color-text` | `#1E293B` | Dark slate body text |
| Heading font | `Baloo 2` (400/500/600/700) | Google Fonts |
| Body font | `Comic Neue` (300/400/700) | Google Fonts |
| Style | Claymorphism | thick borders 3-4px, radius 16-24px, double shadows |
| Icon set | Lucide React | SVG only, no emoji |

---

## Directory Structure (Source Tree)

```
/home/evan/luminace/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── monit/
│   ├── monitrc
│   ├── conf.d/
│   │   ├── nginx.conf
│   │   ├── pg-business.conf
│   │   ├── pg-vector.conf
│   │   ├── luminance-api.conf
│   │   └── luminance-ai.conf
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── luminance.conf
├── scripts/
│   ├── init-pg.sh          # initialize both PG instances + pgvector
│   ├── start-services.sh   # called by tini; starts monit
│   └── entrypoint.sh
├── backend/                # Go Kratos project
│   ├── cmd/
│   │   └── luminance-api/
│   │       └── main.go
│   ├── api/
│   │   └── luminance/
│   │       └── v1/
│   │           └── .gitkeep
│   ├── internal/
│   │   ├── biz/
│   │   │   └── .gitkeep
│   │   ├── data/
│   │   │   └── .gitkeep
│   │   ├── server/
│   │   │   ├── http.go
│   │   │   └── grpc.go
│   │   └── service/
│   │       └── .gitkeep
│   ├── configs/
│   │   └── config.yaml
│   ├── go.mod
│   └── go.sum
├── frontend/               # React + Vite project
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css       # design-system tokens + Tailwind base
│   │   └── components/
│   │       └── .gitkeep
│   └── public/
│       └── favicon.ico
└── ai/
    ├── main.py
    └── requirements.txt
```

---

## Task 1: Repository Skeleton & .gitignore

**Files:**
- Create: `.gitignore`
- Create: `README.md` (minimal)
- Create: each directory tree listed above (via .gitkeep files)

- [ ] **Step 1: Create root .gitignore**

```gitignore
# Go
backend/bin/
backend/*.out
backend/vendor/

# Node
frontend/node_modules/
frontend/dist/

# Python
ai/__pycache__/
ai/*.pyc
ai/.venv/

# Docker / OS
.env
*.log
.DS_Store
```

- [ ] **Step 2: Create all directories with .gitkeep placeholders**

```bash
mkdir -p backend/cmd/luminance-api \
         backend/api/luminance/v1 \
         backend/internal/{biz,data,server,service} \
         backend/configs \
         frontend/src/components \
         frontend/public \
         ai \
         monit/conf.d \
         nginx/conf.d \
         scripts \
         docs/superpowers/plans

touch backend/api/luminance/v1/.gitkeep \
      backend/internal/biz/.gitkeep \
      backend/internal/data/.gitkeep \
      backend/internal/service/.gitkeep \
      frontend/src/components/.gitkeep
```

- [ ] **Step 3: Commit skeleton**

```bash
git init
git add .
git commit -m "chore: initialize repository skeleton"
```

---

## Task 2: Go Kratos Backend Scaffold

**Files:**
- Create: `backend/go.mod`
- Create: `backend/cmd/luminance-api/main.go`
- Create: `backend/internal/server/http.go`
- Create: `backend/internal/server/grpc.go`
- Create: `backend/configs/config.yaml`

- [ ] **Step 1: Initialize Go module**

```bash
cd backend
go mod init github.com/luminance/backend
```

- [ ] **Step 2: Add Kratos and core dependencies to go.mod**

```bash
go get github.com/go-kratos/kratos/v2@latest
go get github.com/go-kratos/kratos/v2/transport/http
go get github.com/go-kratos/kratos/v2/transport/grpc
go get google.golang.org/grpc
go get google.golang.org/protobuf
```

- [ ] **Step 3: Write `backend/configs/config.yaml`**

```yaml
server:
  http:
    addr: 0.0.0.0:8000
    timeout: 1s
  grpc:
    addr: 0.0.0.0:9000
    timeout: 1s

data:
  database:
    business:
      driver: postgres
      source: "host=127.0.0.1 port=5432 user=luminance dbname=luminance sslmode=disable"
    vector:
      driver: postgres
      source: "host=127.0.0.1 port=5433 user=luminance dbname=luminance_vector sslmode=disable"

log:
  level: info
  path: /data/log/luminance-api.log
```

- [ ] **Step 4: Write `backend/internal/server/http.go`**

```go
package server

import (
	"github.com/go-kratos/kratos/v2/transport/http"
)

// NewHTTPServer creates a new HTTP server (no routes yet — scaffold only).
func NewHTTPServer() *http.Server {
	srv := http.NewServer(
		http.Address(":8000"),
	)
	return srv
}
```

- [ ] **Step 5: Write `backend/internal/server/grpc.go`**

```go
package server

import (
	"github.com/go-kratos/kratos/v2/transport/grpc"
)

// NewGRPCServer creates a new gRPC server (scaffold only).
func NewGRPCServer() *grpc.Server {
	srv := grpc.NewServer(
		grpc.Address(":9000"),
	)
	return srv
}
```

- [ ] **Step 6: Write `backend/cmd/luminance-api/main.go`**

```go
package main

import (
	"os"

	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/luminance/backend/internal/server"
)

func main() {
	logger := log.NewStdLogger(os.Stdout)
	httpSrv := server.NewHTTPServer()
	grpcSrv := server.NewGRPCServer()

	app := kratos.New(
		kratos.Name("luminance-api"),
		kratos.Logger(logger),
		kratos.Server(httpSrv, grpcSrv),
	)

	if err := app.Run(); err != nil {
		log.NewHelper(logger).Fatalf("failed to run: %v", err)
	}
}
```

- [ ] **Step 7: Verify the code compiles**

```bash
cd backend
go build ./...
```
Expected: no errors, binary artifacts ignored by .gitignore.

- [ ] **Step 8: Commit**

```bash
cd ..
git add backend/
git commit -m "feat(backend): scaffold Go Kratos project structure"
```

---

## Task 3: Python AI Service Scaffold

**Files:**
- Create: `ai/requirements.txt`
- Create: `ai/main.py`

- [ ] **Step 1: Write `ai/requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sentence-transformers==3.0.1
psycopg2-binary==2.9.9
```

- [ ] **Step 2: Write `ai/main.py`**

```python
"""
Luminance AI Service — scaffold only, no business logic.
Process name: luminance-ai
Listens on: 0.0.0.0:8001
"""
from fastapi import FastAPI

app = FastAPI(title="Luminance AI", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "luminance-ai"}
```

- [ ] **Step 3: Commit**

```bash
git add ai/
git commit -m "feat(ai): scaffold Python FastAPI AI service"
```

---

## Task 4: React + Vite + Tailwind Frontend Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Write `frontend/package.json`**

```json
{
  "name": "luminance-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.395.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Write `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',   // default Vite output — Dockerfile copies from /build/frontend/dist/
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ai':  'http://localhost:8001',
    },
  },
})
```

- [ ] **Step 3: Write `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write `frontend/tailwind.config.ts`** (with Luminance design tokens)

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Luminance Design System ── Claymorphism / Educational Platform ──
      colors: {
        primary:   '#2563EB',
        secondary: '#3B82F6',
        cta:       '#F97316',
        surface:   '#F8FAFC',
        text:      '#1E293B',
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'sans-serif'],
        body:    ['"Comic Neue"', 'cursive'],
      },
      borderRadius: {
        clay: '20px',   // claymorphism default
      },
      borderWidth: {
        clay: '3px',
      },
      boxShadow: {
        // Claymorphism double-shadow
        clay: '4px 4px 0px 0px rgba(37,99,235,0.25), 8px 8px 0px 0px rgba(37,99,235,0.10)',
        'clay-cta': '4px 4px 0px 0px rgba(249,115,22,0.30), 8px 8px 0px 0px rgba(249,115,22,0.12)',
      },
      transitionTimingFunction: {
        'clay-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Write `frontend/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Write `frontend/index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Luminance Design System fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&family=Comic+Neue:wght@300;400;700&display=swap" rel="stylesheet" />
    <title>Luminance</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `frontend/src/index.css`** (design-system CSS variables + Tailwind)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Luminance Design System CSS Variables ── */
:root {
  --color-primary:   #2563EB;
  --color-secondary: #3B82F6;
  --color-cta:       #F97316;
  --color-bg:        #F8FAFC;
  --color-text:      #1E293B;

  /* Claymorphism radius & border */
  --radius-clay:  20px;
  --border-clay:  3px solid var(--color-primary);

  /* Animation tokens */
  --duration-micro: 150ms;
  --duration-base:  250ms;
  --ease-clay-out:  cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Base typography */
body {
  font-family: 'Comic Neue', cursive;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 700;
}

/* Respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 8: Write `frontend/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 9: Write `frontend/src/App.tsx`** (scaffold placeholder only)

```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div
        className="bg-white border-clay border-[3px] border-primary rounded-[20px] shadow-clay p-10 max-w-md text-center"
        style={{ borderColor: 'var(--color-primary)' }}
      >
        <h1 className="font-heading text-3xl font-bold text-primary mb-3">
          Luminance
        </h1>
        <p className="font-body text-text">
          Educational Platform — scaffold ready.
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): scaffold React 18 + Vite + Tailwind with Luminance design system"
```

---

## Task 5: Nginx Configuration

**Files:**
- Create: `nginx/nginx.conf`
- Create: `nginx/conf.d/luminance.conf`

- [ ] **Step 1: Write `nginx/nginx.conf`**

```nginx
user nginx;
worker_processes auto;
error_log /data/log/nginx-error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent"';

    access_log  /data/log/nginx-access.log  main;

    sendfile        on;
    keepalive_timeout  65;
    gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```

- [ ] **Step 2: Write `nginx/conf.d/luminance.conf`**

```nginx
server {
    listen 80;
    server_name _;

    root /opt/luminance/web;
    index index.html;

    # API reverse proxy → Go Kratos
    location /api/ {
        proxy_pass         http://127.0.0.1:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # AI reverse proxy → Python FastAPI
    location /ai/ {
        proxy_pass         http://127.0.0.1:8001;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SPA fallback — serve index.html for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add nginx/
git commit -m "feat(nginx): configure reverse proxy for API and AI services + SPA fallback"
```

---

## Task 6: Monit Process Supervision

**Files:**
- Create: `monit/monitrc`
- Create: `monit/conf.d/nginx.conf`
- Create: `monit/conf.d/pg-business.conf`
- Create: `monit/conf.d/pg-vector.conf`
- Create: `monit/conf.d/luminance-api.conf`
- Create: `monit/conf.d/luminance-ai.conf`

- [ ] **Step 1: Write `monit/monitrc`**

```
set daemon 30
set logfile /data/log/monit.log
set pidfile /var/run/monit.pid

set httpd port 2812 and
  use address localhost
  allow localhost

include /etc/monit/conf.d/*.conf
```

- [ ] **Step 2: Write `monit/conf.d/nginx.conf`**

```
check process nginx with pidfile /var/run/nginx.pid
  start program = "/usr/sbin/nginx -c /etc/nginx/nginx.conf"
  stop  program = "/usr/sbin/nginx -s stop"
  if failed host localhost port 80 protocol http then restart
  if 3 restarts within 5 cycles then timeout
```

- [ ] **Step 3: Write `monit/conf.d/pg-business.conf`**

```
check process pg-business with pidfile /data/pg-business/postmaster.pid
  start program = "/usr/local/bin/pg_ctl -D /data/pg-business -l /data/log/pg-business.log start"
  stop  program = "/usr/local/bin/pg_ctl -D /data/pg-business stop"
  if failed host localhost port 5432 type TCP then restart
  if 3 restarts within 5 cycles then timeout
```

- [ ] **Step 4: Write `monit/conf.d/pg-vector.conf`**

```
check process pg-vector with pidfile /data/pg-vector/postmaster.pid
  start program = "/usr/local/bin/pg_ctl -D /data/pg-vector -l /data/log/pg-vector.log start"
  stop  program = "/usr/local/bin/pg_ctl -D /data/pg-vector stop"
  if failed host localhost port 5433 type TCP then restart
  if 3 restarts within 5 cycles then timeout
```

- [ ] **Step 5: Write `monit/conf.d/luminance-api.conf`**

```
check process luminance-api matching "luminance-api"
  start program = "/opt/luminance/bin/luminance-api"
  stop  program = "/bin/bash -c 'pkill -TERM -x luminance-api || true'"
  if failed host localhost port 8000 protocol http
    request "/healthz"
    then restart
  if 3 restarts within 5 cycles then timeout
```

- [ ] **Step 6: Write `monit/conf.d/luminance-ai.conf`**

```
check process luminance-ai matching "uvicorn"
  start program = "/bin/bash -c 'cd /opt/luminance/ai && /usr/local/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8001'"
  stop  program = "/bin/bash -c 'pkill -TERM -f \"uvicorn main:app\" || true'"
  if failed host localhost port 8001 protocol http
    request "/health"
    then restart
  if 3 restarts within 5 cycles then timeout
```

- [ ] **Step 7: Commit**

```bash
git add monit/
git commit -m "feat(monit): configure process supervision for all services"
```

---

## Task 7: Database Initialization Scripts

**Files:**
- Create: `scripts/init-pg.sh`
- Create: `scripts/entrypoint.sh`
- Create: `scripts/start-services.sh`

- [ ] **Step 1: Write `scripts/init-pg.sh`**

```bash
#!/usr/bin/env bash
# Initialize both PostgreSQL instances on first boot.
# Safe to re-run: checks if data directory already exists.
set -euo pipefail

PG_USER="luminance"
PG_PASS="luminance"

init_instance() {
  local data_dir="$1"
  local port="$2"
  local dbname="$3"
  local extensions="${4:-}"   # optional space-separated extension list

  if [ ! -f "${data_dir}/PG_VERSION" ]; then
    echo "[init-pg] Initializing PostgreSQL at ${data_dir} (port ${port})"
    initdb -D "${data_dir}" --username="${PG_USER}" --pwfile=<(echo "${PG_PASS}")

    # Configure port
    sed -i "s/^#port = 5432/port = ${port}/" "${data_dir}/postgresql.conf"

    # Start temporarily for initialization
    pg_ctl -D "${data_dir}" -l "/data/log/pg-init-${port}.log" start
    sleep 3

    # Create database and extensions
    PGPASSWORD="${PG_PASS}" psql -U "${PG_USER}" -p "${port}" -c "CREATE DATABASE ${dbname};" || true
    if [ -n "${extensions}" ]; then
      for ext in ${extensions}; do
        PGPASSWORD="${PG_PASS}" psql -U "${PG_USER}" -p "${port}" -d "${dbname}" \
          -c "CREATE EXTENSION IF NOT EXISTS ${ext};" || true
      done
    fi

    pg_ctl -D "${data_dir}" stop
    echo "[init-pg] Instance at ${data_dir} ready."
  else
    echo "[init-pg] Instance at ${data_dir} already initialized — skipping."
  fi
}

mkdir -p /data/pg-business /data/pg-vector /data/log

# Business DB — port 5432
init_instance /data/pg-business 5432 luminance

# Vector DB — port 5433, with pgvector
init_instance /data/pg-vector 5433 luminance_vector "vector"
```

- [ ] **Step 2: Write `scripts/start-services.sh`**

```bash
#!/usr/bin/env bash
# Start all services via monit (called by tini/entrypoint).
set -euo pipefail

echo "[start] Initializing data directories..."
bash /opt/luminance/scripts/init-pg.sh

echo "[start] Starting monit..."
exec /usr/bin/monit -Ic /etc/monit/monitrc
```

- [ ] **Step 3: Write `scripts/entrypoint.sh`**

```bash
#!/usr/bin/env bash
# entrypoint.sh — handed to tini as PID 1's child.
set -euo pipefail
exec bash /opt/luminance/scripts/start-services.sh
```

- [ ] **Step 4: Make scripts executable in repo**

```bash
chmod +x scripts/init-pg.sh scripts/start-services.sh scripts/entrypoint.sh
```

- [ ] **Step 5: Commit**

```bash
git add scripts/
git commit -m "feat(scripts): add PG initialization and service entrypoint scripts"
```

---

## Task 8: Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`

- [ ] **Step 1: Write `.dockerignore`**

```
frontend/node_modules
frontend/dist
backend/bin
.git
*.md
docs/
```

- [ ] **Step 2: Write `Dockerfile`**

```dockerfile
# ─────────────────────────────────────────────
# Stage 1: Build Go binary
# ─────────────────────────────────────────────
FROM golang:1.22-alpine AS go-builder

WORKDIR /build/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux go build -o luminance-api ./cmd/luminance-api

# ─────────────────────────────────────────────
# Stage 2: Build React frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build
# output is at /build/frontend/dist/ (vite default outDir)

# ─────────────────────────────────────────────
# Stage 3: Runtime — CentOS 7
# ─────────────────────────────────────────────
FROM centos:7

# ── PostgreSQL 15 via official PGDG repo ─────
# CentOS 7 ships PG 9.2; we need PG 15 for pgvector compatibility.
RUN yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm && \
    yum install -y \
      epel-release && \
    yum install -y \
      tini \
      monit \
      nginx \
      postgresql15-server \
      postgresql15-contrib \
      sudo \
      curl && \
    yum clean all

# Symlink PG 15 tools to PATH
RUN ln -s /usr/pgsql-15/bin/initdb    /usr/local/bin/initdb && \
    ln -s /usr/pgsql-15/bin/pg_ctl    /usr/local/bin/pg_ctl && \
    ln -s /usr/pgsql-15/bin/psql      /usr/local/bin/psql && \
    ln -s /usr/pgsql-15/bin/postgres  /usr/local/bin/postgres

# ── Python 3.9 via Software Collections (SCL) ─
# CentOS 7 default python3 = 3.6; sentence-transformers requires >= 3.8.
RUN yum install -y centos-release-scl && \
    yum install -y rh-python39 rh-python39-python-pip && \
    yum clean all

# Make python3.9 the default python3 for all subsequent RUN layers and scripts
RUN echo 'source /opt/rh/rh-python39/enable' >> /etc/bashrc && \
    ln -sf /opt/rh/rh-python39/root/usr/bin/python3.9 /usr/local/bin/python3 && \
    ln -sf /opt/rh/rh-python39/root/usr/bin/pip3.9    /usr/local/bin/pip3

# ── pgvector (build against PG 15 headers) ───
RUN yum install -y postgresql15-devel make gcc git && \
    git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git /tmp/pgvector && \
    cd /tmp/pgvector && \
    PG_CONFIG=/usr/pgsql-15/bin/pg_config make && \
    PG_CONFIG=/usr/pgsql-15/bin/pg_config make install && \
    rm -rf /tmp/pgvector && \
    yum remove -y git make gcc && \
    yum clean all

# ── Directory structure ───────────────────────
RUN mkdir -p \
      /opt/luminance/bin \
      /opt/luminance/web \
      /opt/luminance/ai \
      /opt/luminance/configs \
      /opt/luminance/scripts \
      /data/log \
      /data/pg-business \
      /data/pg-vector \
      /etc/monit/conf.d \
      /etc/nginx/conf.d

# ── Copy build artifacts ─────────────────────
COPY --from=go-builder      /build/backend/luminance-api /opt/luminance/bin/luminance-api
COPY --from=frontend-builder /build/frontend/dist/        /opt/luminance/web/

# ── Copy Python AI service ───────────────────
COPY ai/requirements.txt /opt/luminance/ai/
RUN pip3 install --no-cache-dir -r /opt/luminance/ai/requirements.txt
COPY ai/ /opt/luminance/ai/

# ── Copy config files ────────────────────────
COPY backend/configs/config.yaml /opt/luminance/configs/config.yaml
COPY nginx/nginx.conf            /etc/nginx/nginx.conf
COPY nginx/conf.d/               /etc/nginx/conf.d/
COPY monit/monitrc               /etc/monit/monitrc
COPY monit/conf.d/               /etc/monit/conf.d/
COPY scripts/                    /opt/luminance/scripts/

RUN chmod +x /opt/luminance/scripts/*.sh && \
    chmod 600 /etc/monit/monitrc

# ── Symlink scripts for PATH convenience ─────
RUN ln -s /opt/luminance/scripts/entrypoint.sh /entrypoint.sh

VOLUME ["/data"]

EXPOSE 80 2812

ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
```

- [ ] **Step 3: Write `docker-compose.yml`**

```yaml
version: '3.9'
services:
  luminance:
    build: .
    image: luminance:latest
    container_name: luminance
    ports:
      - "80:80"
      - "2812:2812"   # monit web UI
    volumes:
      - /opt/luminance:/data
    restart: unless-stopped
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore docker-compose.yml
git commit -m "feat(docker): multi-stage Dockerfile with CentOS 7 runtime, tini + monit"
```

---

## Task 9: Verify Build (Local Smoke Test)

- [ ] **Step 1: Build Go binary locally (sanity check)**

```bash
cd backend && go build ./... && cd ..
```
Expected: no errors.

- [ ] **Step 2: Check Python dependencies install without error**

```bash
pip3 install --dry-run -r ai/requirements.txt 2>&1 | tail -5
```
Expected: no resolution errors.

- [ ] **Step 3: Check frontend config parses**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20 && cd ..
```
Expected: no TypeScript errors.

- [ ] **Step 4: (Optional) Docker build**

```bash
docker build -t luminance:scaffold . 2>&1 | tail -30
```
Expected: `Successfully built <id>`

- [ ] **Step 5: Final commit + tag**

```bash
git add -A
git commit -m "chore: scaffold complete — all services wired, no business logic"
git tag v0.1.0-scaffold
```

---

## Final Directory Verification

After build, confirm this layout inside the container:

```
/opt/luminance/
├── bin/luminance-api        ✓ Go binary
├── web/index.html           ✓ React SPA
├── web/assets/              ✓ Vite hashed assets
├── ai/main.py               ✓ FastAPI service
├── ai/requirements.txt      ✓
└── configs/config.yaml      ✓

/data/
├── log/                     ✓ all service logs
├── pg-business/             ✓ business DB (port 5432)
└── pg-vector/               ✓ vector DB (port 5433, pgvector)
```

---

## Notes for Business Logic Implementation

- **Go Kratos routes**: add protos under `backend/api/luminance/v1/`, implement in `internal/service/` and `internal/biz/`
- **Database migrations**: add a migration tool (e.g., `golang-migrate`) as a separate task
- **pgvector usage**: connect to port 5433, run `SELECT * FROM pg_extension WHERE extname='vector';` to confirm extension active
- **AI embeddings**: import `SentenceTransformer` in `ai/main.py`, add `/embed` endpoint
- **Design system expansion**: add new pages under `frontend/src/pages/`, follow Claymorphism tokens in `tailwind.config.ts`
