# Zenith Scores Frontend

Dark mode dashboard for real-time market intelligence powered by Machine Alpha.

## 🚀 Features

- **Market Regime Monitor**: Real-time BULLISH/BEARISH/CONSOLIDATION signals
- **VIX Tracking**: Live volatility index monitoring
- **200-Day SMA**: Trend analysis visualization
- **Zenith Leaders**: Top 100 tokens by Zenith Score
- **Dark Mode UI**: Premium glassmorphism design
- **Real-time Charts**: Interactive Chart.js visualizations

## 📋 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **API**: FastAPI backend (Machine Alpha)

## 🛠️ Setup

### Prerequisites
- Node.js 18+ installed
- Backend API running on port 8000

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

Visit http://localhost:3000

## 🌐 Environment Variables

Create `.env.local`:

```env
# Local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (after backend deployment)
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
```

## 📁 Project Structure

```
zenithscores-frontend/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── MarketRegimeMonitor.tsx  # Top monitor component
│   └── ZenithLeaders.tsx        # Leaders table component
├── public/                   # Static assets
└── .env.local               # Environment variables
```

## 🎨 Components

### MarketRegimeMonitor
- Displays current market regime (BULLISH/BEARISH/CONSOLIDATION)
- Shows VIX, 200-Day SMA, and analysis date
- Interactive Chart.js line chart
- Color-coded regime indicators

### ZenithLeaders
- Featured token (TSLA) with Zenith Score 2.1
- Top 100 tokens table
- 24h change, volume, and trend indicators
- Interactive row selection

## 🔌 API Integration

The dashboard fetches data from:

```typescript
GET /api/v1/market_regime

Response:
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

Auto-refreshes every 5 minutes.

## 🎨 Design System

### Colors
- **Background**: Black (#000000)
- **Cards**: Gray-900 to Black gradient
- **Borders**: Gray-800 (#1f2937)
- **Text**: White/Gray-400
- **Bullish**: Green-400 (#10b981)
- **Bearish**: Red-400 (#ef4444)
- **Consolidation**: Yellow-400 (#f59e0b)

### Typography
- **Headings**: Bold, gradient text
- **Metrics**: Monospace font
- **Body**: Sans-serif

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Production)
In Vercel Dashboard, add:
- `NEXT_PUBLIC_API_URL`: Your deployed backend URL

### Build for Production

```bash
npm run build
npm start
```

## 📊 Features Roadmap

- [ ] Historical regime data chart
- [ ] Real-time WebSocket updates
- [ ] Token detail pages
- [ ] Custom watchlists
- [ ] Email alerts for regime changes
- [ ] Mobile responsive optimizations
- [ ] Export data to CSV
- [ ] Dark/Light mode toggle

## 🐛 Troubleshooting

### API Connection Error
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled in backend

### Chart Not Rendering
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check browser console for errors

### Build Errors
- Update Next.js: `npm install next@latest`
- Clear node_modules: `rm -rf node_modules && npm install`

## 📝 Development

### Run Development Server
```bash
npm run dev
```

### Type Checking
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 🔗 Links

- **Backend Repo**: [project-zenith](https://github.com/Snooz4pm/project-zenith)
- **API Docs**: See `API_DOCUMENTATION.md` in backend repo
- **Deployment Guide**: See `VERCEL_DEPLOYMENT.md`

## 📄 License

© 2025 Zenith Scores. All rights reserved.

---

**Built with ❤️ using Next.js and Machine Alpha**
