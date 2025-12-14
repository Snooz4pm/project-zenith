# Zenith Scores

Real-time crypto token analytics dashboard powered by DexScreener.

## 🚀 Features

- **Live Token Data**: Real-time trending tokens from DexScreener
- **Interactive Dashboard**: Dark mode UI with sorting and filtering
- **No Database Required**: Stateless, simple architecture
- **Easy Deployment**: Deploy to Vercel in minutes

## 📁 Project Structure

```
zenith-scores/
├── api/
│   └── main.py              # FastAPI backend
├── zenithscores-frontend/   # Next.js frontend
│   ├── app/
│   ├── components/
│   └── lib/
├── .gitignore              # Security (prevents .env leaks)
├── requirements.txt         # Python dependencies
├── vercel.json             # Backend deployment config
└── README.md               # This file
```

## 🛠️ Local Development

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run API server
python api/main.py
# API runs on http://localhost:8000
```

### Frontend

```bash
cd zenithscores-frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## 🌐 API Endpoints

- `GET /` - API information
- `GET /api/v1/health` - Health check
- `GET /api/v1/tokens/trending` - Get trending tokens
  - Query params: `limit` (default: 100), `min_liquidity` (default: 150000), `min_volume` (default: 250000)

## 🔐 Environment Variables

### Backend
No environment variables required! DexScreener API is public.

Optional:
```bash
PORT=8000
ENVIRONMENT=production
```

### Frontend
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, use your deployed backend URL.

## 🚀 Deployment

### Deploy Backend to Vercel

```bash
vercel --prod
```

No environment variables needed!

### Deploy Frontend to Vercel

```bash
cd zenithscores-frontend
vercel --prod
```

Add environment variable in Vercel Dashboard:
- `NEXT_PUBLIC_API_URL` = Your deployed backend URL

## 🔒 Security

- `.env` files are gitignored
- No API keys required
- No database credentials
- Stateless architecture

## 📊 Tech Stack

**Backend:**
- FastAPI
- Python 3.11+
- DexScreener API

**Frontend:**
- Next.js 16
- TypeScript
- Tailwind CSS
- Chart.js

## 📝 License

MIT

## 🤝 Contributing

Feel free to open issues or submit PRs!

---

**Built with ❤️ for the crypto community**
