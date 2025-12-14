# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### Files Ready
- [x] `vercel.json` - Deployment configuration
- [x] `requirements.txt` - Python dependencies
- [x] `api/main.py` - FastAPI application
- [x] `.gitignore` - Secrets excluded
- [x] All code committed and pushed to GitHub

### Environment Variables Prepared
Have these ready to add to Vercel:

```
ALPHA_VANTAGE_API_KEY=HRCSUGY7691O82H6
NEON_DATABASE_URL=postgresql://neondb_owner:npg_waDHR3tCfeq6@ep-summer-hall-adkxe002-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 📋 Deployment Steps

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
- Choose your login method (GitHub recommended)
- Authorize Vercel

### Step 3: Link Project (First Time)
```bash
cd c:\Users\boume\defi-oracle-worker
vercel
```
- Follow prompts:
  - Set up and deploy? **Y**
  - Which scope? (Select your account)
  - Link to existing project? **N**
  - Project name? **project-zenith-api** (or your choice)
  - Directory? **./** (current directory)
  - Override settings? **N**

### Step 4: Add Environment Variables
```bash
# Add Alpha Vantage API Key
vercel env add ALPHA_VANTAGE_API_KEY
# When prompted, paste: HRCSUGY7691O82H6
# Select: Production, Preview, Development (all)

# Add Neon Database URL
vercel env add NEON_DATABASE_URL
# When prompted, paste your full connection string
# Select: Production, Preview, Development (all)
```

### Step 5: Deploy to Production
```bash
vercel --prod
```

Wait for deployment to complete. You'll get a URL like:
```
https://project-zenith-api.vercel.app
```

### Step 6: Test Deployment
```bash
# Test health endpoint
curl https://your-deployment-url.vercel.app/

# Test market regime endpoint
curl https://your-deployment-url.vercel.app/api/v1/market_regime
```

Expected response:
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

---

## 🔧 Post-Deployment Configuration

### Update Frontend Environment Variables
In your Next.js frontend (`protocol-zenith-frontend`), update:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-deployment-url.vercel.app
```

### Setup Daily Sync (Choose One)

#### Option A: GitHub Actions (Recommended)
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add secrets:
   - `ALPHA_VANTAGE_API_KEY`
   - `NEON_DATABASE_URL`
4. Create `.github/workflows/daily-sync.yml` (see VERCEL_DEPLOYMENT.md)
5. Commit and push

#### Option B: External Cron Service
Use a service like cron-job.org:
1. Create account at https://cron-job.org
2. Add job: `https://your-deployment-url.vercel.app/api/sync`
3. Schedule: Daily at 9 PM UTC (after market close)

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] API health endpoint responds: `GET /`
- [ ] Market regime endpoint works: `GET /api/v1/market_regime`
- [ ] History endpoint works: `GET /api/v1/market_regime/history`
- [ ] CORS allows frontend access
- [ ] Environment variables are set correctly
- [ ] Database connection is working
- [ ] No secrets in logs or responses

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found" error
**Solution**: Ensure all dependencies are in `requirements.txt`
```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update dependencies"
git push
vercel --prod
```

### Issue: Database connection timeout
**Solution**: Check Neon database allows connections from Vercel IPs
- Neon → Settings → IP Allow → Add `0.0.0.0/0` (or Vercel IP ranges)

### Issue: Environment variables not working
**Solution**: Redeploy after adding variables
```bash
vercel --prod
```

### Issue: CORS errors from frontend
**Solution**: Update `api/main.py` CORS settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

---

## 📊 Monitoring

### View Logs
```bash
# Real-time logs
vercel logs --follow

# Specific deployment
vercel logs [deployment-url]
```

### Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project
- View: Deployments, Analytics, Logs

---

## 🔄 Redeployment

For code changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
vercel --prod
```

Vercel will auto-deploy on push if you enable GitHub integration.

---

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ API responds at Vercel URL
2. ✅ Market regime data is returned correctly
3. ✅ Frontend can fetch data (CORS working)
4. ✅ Database queries execute successfully
5. ✅ No errors in Vercel logs
6. ✅ Environment variables are secure

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **Project Docs**: See `VERCEL_DEPLOYMENT.md`

---

**Ready to deploy?** 

```bash
vercel --prod
```

🚀 **Let's ship it!**
