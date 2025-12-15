# News Signal Portal - Frontend

Modern news intelligence dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📰 Real-time news feed from autonomous scraper
- 🏷️ Category-based navigation (8 categories)
- 🎯 Confidence scoring visualization
- 🤖 AI-powered "Why it matters" summaries
- 🔍 Full-text search
- 📊 Stats dashboard
- ⚡ Auto-refresh
- 🎨 Beautiful, responsive design

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev

# Open http://localhost:3000
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: REST (connects to FastAPI backend)
- **Deployment**: Vercel

## Project Structure

```
news-portal-frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx    # Category pages
│   └── search/
│       └── page.tsx        # Search page
├── components/
│   ├── ArticleCard.tsx     # Article display
│   ├── CategorySidebar.tsx # Navigation
│   ├── SearchBar.tsx       # Search component
│   └── StatsWidget.tsx     # Statistics
├── lib/
│   ├── api.ts              # API client
│   └── types.ts            # TypeScript types
└── public/
    └── icons/              # Category icons
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

## Deployment

```bash
# Deploy to Vercel
vercel deploy

# Or connect your GitHub repo to Vercel
```

## Features in Detail

### Category Navigation
- 8 categories with icons
- Real-time article counts
- Active state highlighting

### Article Display
- Confidence score badge
- Source attribution
- AI summaries (if available)
- Keyword tags
- Direct link to source

### Search
- Full-text search across all articles
- Real-time results
- Category filtering

### Auto-Refresh
- Configurable refresh interval
- New article notifications
- Manual refresh button
