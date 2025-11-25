# Retirement Simulation API

FastAPI backend for Canadian retirement planning calculations.

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   cd juan-retirement-app
   pip install -r requirements-api.txt
   ```

2. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Run the Server**
   ```bash
   python api/main.py
   ```

   Or use uvicorn directly:
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```

4. **Test the API**
   - Open browser: http://localhost:8000/docs (Swagger UI)
   - Or: http://localhost:8000/redoc (ReDoc)
   - Health check: http://localhost:8000/api/health

## 📡 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/api/health` | GET | Health check |
| `/api/ready` | GET | Readiness probe |
| `/api/live` | GET | Liveness probe |

### Simulation Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/run-simulation` | POST | Run full retirement simulation |
| `/api/analyze-composition` | POST | Analyze portfolio composition |

### Optimization Endpoints (Coming Soon)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/optimize-strategy` | POST | Optimize withdrawal strategy |
| `/api/monte-carlo` | POST | Monte Carlo simulation |

## 🧪 Testing

### Manual Testing with cURL

**Health Check:**
```bash
curl http://localhost:8000/api/health
```

**Run Simulation:**
```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d @test-household.json
```

**Example Test Data** (`test-household.json`):
```json
{
  "p1": {
    "name": "Juan",
    "start_age": 65,
    "cpp_start_age": 65,
    "cpp_annual_at_start": 15000,
    "oas_start_age": 65,
    "oas_annual_at_start": 8500,
    "tfsa_balance": 202000,
    "rrif_balance": 225000,
    "rrsp_balance": 0,
    "nonreg_balance": 412500,
    "corporate_balance": 1202500,
    "nonreg_acb": 300000,
    "nr_cash_pct": 10.0,
    "nr_gic_pct": 20.0,
    "nr_invest_pct": 70.0,
    "corp_cash_pct": 5.0,
    "corp_gic_pct": 10.0,
    "corp_invest_pct": 85.0
  },
  "p2": {
    "name": "Jane",
    "start_age": 65,
    "cpp_start_age": 65,
    "cpp_annual_at_start": 15000,
    "oas_start_age": 65,
    "oas_annual_at_start": 8500,
    "tfsa_balance": 202000,
    "rrif_balance": 225000,
    "rrsp_balance": 0,
    "nonreg_balance": 412500,
    "corporate_balance": 1202500,
    "nonreg_acb": 300000,
    "nr_cash_pct": 10.0,
    "nr_gic_pct": 20.0,
    "nr_invest_pct": 70.0,
    "corp_cash_pct": 5.0,
    "corp_gic_pct": 10.0,
    "corp_invest_pct": 85.0
  },
  "province": "AB",
  "start_year": 2025,
  "end_age": 95,
  "strategy": "corporate-optimized",
  "spending_go_go": 120000,
  "go_go_end_age": 75,
  "spending_slow_go": 90000,
  "slow_go_end_age": 85,
  "spending_no_go": 70000,
  "spending_inflation": 2.0,
  "general_inflation": 2.0
}
```

### Testing with Swagger UI

1. Go to http://localhost:8000/docs
2. Click on an endpoint (e.g., `/api/run-simulation`)
3. Click "Try it out"
4. Fill in or use the example data
5. Click "Execute"
6. View response

## 📦 Deployment

### Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set PORT=8000
   railway variables set PYTHON_ENV=production
   ```

5. **Get URL**
   ```bash
   railway domain
   ```

### Deploy to Render

1. Create new Web Service on Render.com
2. Connect to GitHub repository
3. Set build command: `pip install -r requirements-api.txt`
4. Set start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy!

## 🏗️ Architecture

```
api/
├── main.py              # FastAPI app + CORS + health checks
├── models/
│   ├── requests.py      # Pydantic request models
│   └── responses.py     # Pydantic response models
├── routes/
│   ├── simulation.py    # Simulation endpoints
│   ├── optimization.py  # Optimization endpoints
│   └── monte_carlo.py   # Monte Carlo endpoints
└── utils/
    └── converters.py    # API ↔ internal model converters

modules/                 # Existing simulation engine (unchanged)
utils/                   # Existing utilities (unchanged)
```

## 🔧 Configuration

### CORS

Update `ALLOWED_ORIGINS` in `api/main.py` for production:

```python
ALLOWED_ORIGINS = [
    "https://your-production-domain.vercel.app",
]
```

### Logging

Adjust log level in `api/main.py`:

```python
logging.basicConfig(level=logging.INFO)  # or DEBUG, WARNING, ERROR
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :8000   # Windows (find PID then kill)
```

### Tax Config Not Loading
- Ensure `tax_config_canada_2025.json` exists in juan-retirement-app/
- Check file permissions
- Check logs for file path errors

### Import Errors
- Ensure all dependencies installed: `pip install -r requirements-api.txt`
- Check Python version (3.10+)
- Verify modules/ and utils/ directories exist

## 📊 Monitoring

### Health Check Endpoints

- **Health**: `/api/health` - Returns 200 if service healthy
- **Ready**: `/api/ready` - Returns 200 if ready to handle requests
- **Live**: `/api/live` - Returns 200 if service is alive

### Logs

View logs:
```bash
# Railway
railway logs

# Render
# View in Render dashboard

# Local
# Logs print to console
```

## 📝 Development Notes

### Adding New Endpoints

1. Create route function in appropriate file (`api/routes/*.py`)
2. Define request/response models in `api/models/`
3. Add converter functions in `api/utils/converters.py` if needed
4. Register router in `api/main.py`
5. Test with Swagger UI
6. Update this README

### Code Style

- Use type hints for all functions
- Document all endpoints with docstrings
- Log important operations (INFO level)
- Handle errors gracefully with try/except
- Return structured responses (Pydantic models)

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Simulation Migration Plan](../SIMULATION-MIGRATION-PLAN.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## 📞 Support

For issues or questions:
- Check logs first
- Review [SIMULATION-MIGRATION-PLAN.md](../SIMULATION-MIGRATION-PLAN.md)
- Open an issue on GitHub
