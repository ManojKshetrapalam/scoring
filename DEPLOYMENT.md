# Gevents Unlimited Cricket Platform - Deployment Guide

## Server Requirements
- Node.js 18+ (LTS recommended)
- NPM 9+
- RAM: 512MB minimum (1GB recommended)
- 2GB disk space

## Hosting Configuration (Hostinger hPanel)

### Node.js Application Settings
| Setting | Value |
|---|---|
| Application Domain | `myworks.sbs` |
| Application Path | `/scoring` |
| Application Root | `/` (Repository root) |
| Entry File | `backend/server.js` |
| Node.js Version | 18.x or 20.x |

### Environment Variables (Required)
Add these inside hPanel → Node.js App → Environment Variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5001` (or any available port) |
| `JWT_SECRET` | `your-super-secret-key-change-this` |

---

## Deployment Steps (First Time)

### Step 1: Clone Repository via SSH Terminal
```bash
cd /home/u123456789/domains/myworks.sbs/public_html   # your actual path
git clone https://github.com/ManojKshetrapalam/scoring.git .
```

### Step 2: Build the Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 4: Start the Application
In hPanel → Node.js Application → click **Start** or restart the app.

The single unified server will:
- Serve Next.js pages under `/scoring/*`
- Serve API endpoints under `/scoring/api/*`
- Handle WebSockets at `/scoring/socket.io`

---

## Updating Deployments

```bash
git pull origin main
cd frontend && npm run build && cd ..
# Restart Node.js app in hPanel
```

---

## Nginx Reverse Proxy (VPS Only)
If on a VPS with full Nginx access:

```nginx
server {
    listen 443 ssl;
    server_name myworks.sbs;

    location /scoring {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Verification Checklist

After deployment, test the following URLs:

- [ ] `https://myworks.sbs/scoring` — Homepage loads
- [ ] `https://myworks.sbs/scoring/tournaments` — Tournaments page
- [ ] `https://myworks.sbs/scoring/scorer` — Scorer panel
- [ ] `https://myworks.sbs/scoring/admin` — Admin panel
- [ ] `https://myworks.sbs/scoring/api/health` — API returns `{"success":true}`
- [ ] `https://myworks.sbs/scoring/privacy` — Privacy page (AdSense compliance)
- [ ] `https://myworks.sbs/scoring/terms` — Terms page
- [ ] `https://myworks.sbs/scoring/about` — About page
- [ ] `https://myworks.sbs/scoring/contact` — Contact page

---

## Architecture Summary

```
myworks.sbs/scoring          → Next.js SSR/Static Pages
myworks.sbs/scoring/api      → Express REST API
myworks.sbs/scoring/socket.io → Socket.IO WebSocket
```

All served from a single Node.js process (backend/server.js) on one port.
