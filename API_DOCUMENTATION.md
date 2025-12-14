# Machine Alpha API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Health Check
**GET** `/`

Returns API status and version information.

**Response:**
```json
{
  "service": "Machine Alpha API",
  "version": "1.0.0",
  "status": "operational"
}
```

---

### 2. Get Latest Market Regime
**GET** `/api/v1/market_regime`

Returns the most recent market regime decision.

**Response:**
```json
{
  "status": "success",
  "data": {
    "regime": "BULLISH",
    "date": "2025-12-14",
    "vix_used": 15.74,
    "sma_200": 600.45,
    "updated_at": "2025-12-14T21:23:41.047425"
  }
}
```

**Response Fields:**
- `regime` (string): Current market regime - `BULLISH`, `BEARISH`, or `CONSOLIDATION`
- `date` (string): Date of the regime calculation (ISO format)
- `vix_used` (float): VIX volatility index value used in calculation
- `sma_200` (float): 200-day Simple Moving Average of SPY
- `updated_at` (string): Timestamp of last database update (ISO format)

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: No regime data available
- `500 Internal Server Error`: Database or server error

---

### 3. Get Regime History
**GET** `/api/v1/market_regime/history?limit=30`

Returns historical market regime data.

**Query Parameters:**
- `limit` (integer, optional): Number of records to return (default: 30)

**Response:**
```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "regime": "BULLISH",
      "date": "2025-12-14",
      "vix_used": 15.74,
      "sma_200": 600.45,
      "updated_at": "2025-12-14T21:23:41.047425"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success (returns empty array if no data)
- `500 Internal Server Error`: Database or server error

---

## Regime Logic

### Decision Rules
The system determines market regime based on two factors:

1. **SPY Price vs 200-Day SMA**
2. **VIX Volatility Index**

### Regime States

| Regime | Condition |
|--------|-----------|
| **BULLISH** | SPY > SMA-200 AND VIX < 20 |
| **BEARISH** | SPY < SMA-200 AND VIX > 20 |
| **CONSOLIDATION** | All other conditions |

---

## Running the API

### Development Mode
```bash
python api/main.py
```

### Production Mode
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### With Auto-Reload (Development)
```bash
uvicorn api.main:app --reload
```

---

## CORS Configuration

The API is configured to accept requests from any origin (`*`). 

**For production**, update the CORS middleware in `api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "detail": "Error description"
}
```

Common errors:
- `Database configuration missing`: `.env` file not configured
- `No regime data found`: Database is empty (run `sync_market_regime.py` first)
- `Database error: ...`: Connection or query issues

---

## Frontend Integration Example

### JavaScript/React
```javascript
async function getMarketRegime() {
  const response = await fetch('http://localhost:8000/api/v1/market_regime');
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Current Regime:', data.data.regime);
    console.log('VIX:', data.data.vix_used);
  }
}
```

### Python
```python
import requests

response = requests.get('http://localhost:8000/api/v1/market_regime')
data = response.json()

if data['status'] == 'success':
    regime = data['data']['regime']
    print(f"Market is {regime}")
```

---

## Deployment

### Vercel (Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
```json
{
  "builds": [
    {
      "src": "api/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/main.py"
    }
  ]
}
```
3. Deploy: `vercel --prod`

### Docker
```dockerfile
FROM python:3.14-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/v1/market_regime")
@limiter.limit("60/minute")
def get_market_regime(request: Request):
    # ... existing code
```

---

## Monitoring

### Health Check Endpoint
Use `/` for uptime monitoring services (Pingdom, UptimeRobot, etc.)

### Logging
FastAPI automatically logs all requests. For production, configure structured logging:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **Database Connection**: Use connection pooling for production
3. **HTTPS**: Always use HTTPS in production
4. **Authentication**: Consider adding API keys for production use
5. **Input Validation**: Query parameters are validated by FastAPI

---

## Support

For issues or questions, refer to:
- FastAPI Documentation: https://fastapi.tiangolo.com
- Project README: `SYSTEM_STATUS.md`
