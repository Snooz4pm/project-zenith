# 🎨 NEWS SIGNAL PORTAL - Frontend Deployment Guide

Complete guide to deploying your News Signal Portal frontend.

---

## 🚀 Quick Start (Development)

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser!

---

## 🌐 Production Deployment to Vercel

### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel
```

3**. Set Environment Variable in Vercel**
```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter your production API URL: https://your-api.vercel.app
```

4. **Deploy to Production**
```bash
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/news-portal.git
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Root Directory:** `frontend`
     - **Build Command:** `npm run build`
     - **Output Directory:** `.next`

3. **Add Environment Variables**
   - In Vercel project settings
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-api-url.com`

4. **Deploy!**
   - Vercel will auto-deploy on every push to `main`

---

## 📊 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Homepage (top articles)
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx        # Category pages
│   └── globals.css             # Global styles
├── components/
│   ├── ArticleCard.tsx         # Article display card
│   └── CategorySidebar.tsx     # Navigation sidebar
├── lib/
│   ├── api.ts                  # API client & utilities
│   └── types.ts                # TypeScript definitions
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## 🎨 Features Included

### ✅ Navigation
- **Sidebar** with 8 categories
- **Active state** highlighting
- **Gradient backgrounds** per category
- **Live status** indicator

### ✅ Homepage
- **Top articles** across all categories
- **Statistics dashboard**
- **Confidence badges**
- **Auto-refresh** (every 5 min)

### ✅ Category Pages
- **Category-specific** articles
- **Sorting** by confidence
- **Insights footer** with stats
- **Empty states** with instructions

### ✅ Article Cards
- **Confidence score** badge
- **AI summaries** ("Why it matters")
- **Importance score** progress bar
- **Keyword tags**
- **Source attribution**
- **Relative timestamps**

---

## 🔧 Customization

### Change Colors

Edit `frontend/lib/api.ts` categories:

```typescript
{
  slug: 'technology',
  name: 'Technology',
  icon: '💻',
  color: 'from-blue-500 to-cyan-500', // Change this
  description: '...',
}
```

### Adjust Refresh Rate

Edit `frontend/app/page.tsx`:

```typescript
export const revalidate = 300; // 300 seconds = 5 minutes
```

### Add More Categories

1. Update backend's `enhanced_scraper.py`
2. Update `frontend/lib/api.ts` CATEGORIES array
3. Redeploy both backend and frontend

---

## 🌍 CORS Configuration

### Backend Setup

In `api_server.py`, configure allowed origins:

```python
# For production
ALLOWED_ORIGINS = [
    "https://your-frontend.vercel.app",
    "http://localhost:3000",  # For development
]
```

Or use environment variable in backend `.env`:

```env
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

---

## 📱 Responsive Design

The portal is fully responsive:

- **Desktop:** Full sidebar + 2-column article grid
- **Tablet:** Collapsible sidebar + 1-column grid
- **Mobile:** Hamburger menu + single column

---

## ⚡ Performance Optimizations

### Implemented:
- ✅ **Static Generation** for category pages
- ✅ **ISR** (Incremental Static Regeneration) every 5 minutes
- ✅ **Image optimization** (Next.js built-in)
- ✅ **Tree shaking** (unused code removal)
- ✅ **Code splitting** (automatic by Next.js)

### Recommended:
- Add **loading states** for better UX
- Implement **infinite scroll** for large article lists
- Add **caching headers** for static assets

---

## 🧪 Testing Locally

### Test with Mock Data

If your backend isn't running, you'll see empty states with helpful messages like:

```
No articles found
Run the news pipeline to start collecting articles
python run_pipeline.py full
```

### Test with Real Backend

1. Start backend:
```bash
cd ..
python api_server.py
```

2. In another terminal, start frontend:
```bash
cd frontend
npm run dev
```

3. Open **http://localhost:3000**

---

## 🔍 Troubleshooting

### CORS Errors

**Problem:** Browser shows CORS error

**Solution:**
1. Check backend `ALLOWED_ORIGINS` includes your frontend URL
2. Restart backend after changing CORS settings
3. Clear browser cache

### API Connection Failed

**Problem:** "Failed to fetch" errors

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
2. Check backend is running (`python api_server.py`)
3. Test API directly: `http://localhost:8000/`

### Build Errors

**Problem:** TypeScript or build errors

**Solution:**
```bash
# Clean and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

## 📦 Environment Variables

### Development (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production (Vercel Dashboard)

```env
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

**Important:** All public environment variables must start with `NEXT_PUBLIC_`

---

## 🎯 Next Steps

### Phase 1: Basic Setup ✅
- [x] Install dependencies
- [x] Configure environment
- [x] Run development server
- [x] Test with backend

### Phase 2: Customization
- [ ] Adjust colors/branding
- [ ] Add your logo
- [ ] Customize category icons
- [ ] Tweak refresh rates

### Phase 3: Deployment
- [ ] Deploy backend to Vercel
- [ ] Deploy frontend to Vercel
- [ ] Configure CORS
- [ ] Test production build

### Phase 4: Enhancements
- [ ] Add search page
- [ ] Implement filters (by confidence, date)
- [ ] Add article bookmarking
- [ ] Create admin dashboard

---

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **API:** REST (FastAPI backend)

---

## 🎉 You're Ready!

Your News Signal Portal frontend is ready to deploy!

**Commands Summary:**
```bash
# Development
cd frontend
npm install
npm run dev

# Production
npm run build
npm start

# Deploy
vercel --prod
```

**Live URLs:**
- Dev: http://localhost:3000
- Prod: https://your-project.vercel.app

---

**Questions?** Check the Next.js docs at [nextjs.org](https://nextjs.org) or Vercel docs at [vercel.com/docs](https://vercel.com/docs)
