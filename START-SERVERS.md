# 🚀 Quick Start Guide - Retirement Simulation App

## Start the Application

### Terminal 1 - Python API Backend
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
python3 api/main.py
```

**Expected Output:**
```
2025-12-07 10:16:14 - api.main - INFO - 🚀 Starting Retirement Simulation API
2025-12-07 10:16:14 - api.main - INFO - ✅ Tax configuration loaded successfully
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [6213]
INFO:     Application startup complete.
```

### Terminal 2 - Next.js Frontend
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/webapp
npm run dev
```

**Expected Output:**
```
> retirement-app@0.1.0 dev
> next dev

   ▲ Next.js 15.5.7
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 1134ms
```

## Access the Application

### Web Browser
Open: **http://localhost:3000**

### Test the System
```bash
cd /Users/jrcb/Documents/GitHub/retirezest
./test-end-to-end.sh
```

---

## 📍 Available Routes

| Page | URL | Auth Required |
|------|-----|---------------|
| Home | http://localhost:3000 | No |
| Register | http://localhost:3000/register | No |
| Login | http://localhost:3000/login | No |
| Dashboard | http://localhost:3000/dashboard | Yes |
| Simulation | http://localhost:3000/simulation | Yes |
| Benefits | http://localhost:3000/benefits | Yes |
| CPP Calculator | http://localhost:3000/benefits/cpp | Yes |
| OAS Calculator | http://localhost:3000/benefits/oas | Yes |
| GIS Calculator | http://localhost:3000/benefits/gis | Yes |

---

## 🔑 First Time Setup

1. **Start both servers** (see above)
2. **Open browser** to http://localhost:3000
3. **Register** a new account
4. **Login** with your credentials
5. **Navigate** to Simulation page
6. **Fill in** your retirement details
7. **Click** "Run Simulation"
8. **View** results with charts and analysis

---

## ✅ Verify Everything Works

### 1. Check Python API
```bash
curl http://localhost:8000/api/health
```
Should return:
```json
{"status":"ok","service":"Retirement Simulation API","version":"1.0.0","tax_config_loaded":true,"ready":true}
```

### 2. Test Simulation
```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d @test-simulation.json
```
Should return simulation results with `"success": true`

### 3. Check Next.js
```bash
curl -I http://localhost:3000
```
Should return `HTTP/1.1 200 OK`

---

## 🛑 Stop the Servers

Press `Ctrl+C` in each terminal window to stop the servers.

Or kill all processes:
```bash
pkill -f "uvicorn.*api.main"
pkill -f "next-server"
pkill -f "npm.*dev"
```

---

## 📝 Notes

- **Port 3000**: Next.js frontend
- **Port 8000**: Python FastAPI backend
- **Database**: SQLite at `webapp/prisma/dev.db`
- **Logs**: Check `/tmp/python-api.log` for Python API logs
- **Hot Reload**: Both servers support hot reload during development

---

Enjoy testing your Canadian Retirement Simulator! 🇨🇦
