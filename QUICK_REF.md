# 🚀 QUICK REFERENCE - News Signal Engine

## 📦 Pre-Push Commands

```bash
# 1. Check git status
git status

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: autonomous news signal engine complete"

# 4. Push to GitHub
git push -u origin main
```

## ⚠️ SECURITY CHECK

Before pushing, verify `.env` is NOT committed:
```bash
git ls-files | grep .env
# Should return NOTHING (or only .env.example)
```

## 🌐 Deployment

### Backend (API)
```bash
cd c:\Users\boume\defi-oracle-worker
vercel --prod
```

### Frontend (Portal)
```bash
cd frontend
vercel --prod
```

## 🔑 Environment Variables Needed

### Backend (Vercel Dashboard)
- `NEON_HOST`
- `NEON_DATABASE`
- `NEON_USER`
- `NEON_PASSWORD`
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS`

### Frontend (Vercel Dashboard)
- `NEXT_PUBLIC_API_URL`

## 🧪 Test Locally

```bash
# Terminal 1: Backend
python api_server.py

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Pipeline (optional)
python run_pipeline.py test
```

## 📊 Your Project URLs

After deployment:
- Backend API: `https://your-project.vercel.app`
- Frontend Portal: `https://your-frontend.vercel.app`
- GitHub Repo: `https://github.com/YOUR_USERNAME/news-signal-engine`

## 🎯 What to Push

✅ **DO PUSH:**
- All `.py` files
- All `.md` docs
- `requirements.txt`
- Frontend code
- `vercel.json`
- `.gitignore`
- `ENV_TEMPLATE.txt`

❌ **DON'T PUSH:**
- `.env` (actual credentials)
- `.env.local`
- `__pycache__/`
- `node_modules/`
- `*.log` files
- Database dumps

## 🔄 Continuous Deployment

Once GitHub is connected to Vercel:
```bash
git add .
git commit -m "your changes"
git push
# Vercel auto-deploys! ✅
```

## 📚 Documentation Index

1. `PROJECT_COMPLETE.md` - Overall system summary
2. `MASTER_GUIDE.md` - Complete usage guide
3. `GIT_DEPLOY_GUIDE.md` - Git & deployment details
4. `FRONTEND_DEPLOY.md` - Frontend specific
5. `NEON_SETUP.md` - Database setup

## 🎉 You're Ready!

```bash
# One command to rule them all:
git add . && git commit -m "feat: autonomous news engine" && git push
```

Then deploy:
```bash
vercel --prod
```

**DONE!** 🚀
