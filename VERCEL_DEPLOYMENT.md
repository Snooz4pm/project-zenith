# Vercel Deployment Guide

## Prerequisites
1. Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Environment variables ready (API keys, database URL)

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables
Before deploying, add your secrets to Vercel:

```bash
# Add Alpha Vantage API Key
vercel env add ALPHA_VANTAGE_API_KEY

# Add Neon Database URL
vercel env add NEON_DATABASE_URL

# Add other optional variables
vercel env add PORT
vercel env add ENVIRONMENT
```

When prompted:
- Select environment: **Production, Preview, Development** (choose all)
- Paste your secret value
- Confirm

### 4. Deploy to Production
```bash
# From project root
vercel --prod
```

### 5. Verify Deployment
After deployment, Vercel will provide a URL like:
```
https://project-zenith-xyz.vercel.app
```

Test your endpoints:
```bash
curl https://your-deployment-url.vercel.app/api/v1/market_regime
```

## Configuration Details

### vercel.json Explained
```json
{
  "version": 2,                    // Vercel platform version
  "builds": [
    {
      "src": "api/main.py",        // Entry point for FastAPI
      "use": "@vercel/python"      // Python runtime
    }
  ],
  "routes": [
    {
      "src": "/(.*)",              // Match all routes
      "dest": "api/main.py"        // Forward to FastAPI
    }
  ]
}
```

### Environment Variables
Set these in Vercel Dashboard or CLI:

| Variable | Description | Required |
|----------|-------------|----------|
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key | ✅ Yes |
| `NEON_DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `PORT` | Server port (default: 8000) | ❌ Optional |
| `ENVIRONMENT` | production/development | ❌ Optional |

## Vercel Dashboard Setup

### Via Web Interface
1. Go to https://vercel.com/dashboard
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

4. Add Environment Variables:
   - Go to **Settings** → **Environment Variables**
   - Add each variable for Production, Preview, and Development

5. Deploy!

## API Endpoints (After Deployment)

Your API will be available at:
```
https://your-project.vercel.app/
https://your-project.vercel.app/api/v1/market_regime
https://your-project.vercel.app/api/v1/market_regime/history
```

## Automated Daily Sync

### Option 1: Vercel Cron Jobs
Create `vercel.json` with cron configuration:
```json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 21 * * *"
  }]
}
```

Then add a sync endpoint in `api/main.py`:
```python
@app.get("/api/sync")
def trigger_sync():
    # Run sync_market_regime logic
    pass
```

### Option 2: GitHub Actions
Create `.github/workflows/daily-sync.yml`:
```yaml
name: Daily Market Regime Sync
on:
  schedule:
    - cron: '0 21 * * *'  # 9 PM UTC daily
  workflow_dispatch:      # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run sync
        env:
          ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
          NEON_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
        run: python sync_market_regime.py
```

## Troubleshooting

### Build Fails
- Ensure `requirements.txt` is in root directory
- Check Python version compatibility (Vercel supports 3.9+)
- Verify all imports are in requirements.txt

### Environment Variables Not Working
- Redeploy after adding variables: `vercel --prod`
- Check variable names match exactly (case-sensitive)
- Verify variables are set for "Production" environment

### Database Connection Issues
- Ensure NEON_DATABASE_URL includes `?sslmode=require`
- Check Neon database is accessible from Vercel IPs
- Verify connection string format

### CORS Errors
- Update `api/main.py` CORS settings with your frontend URL
- Don't use `allow_origins=["*"]` in production

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

## Monitoring

### Vercel Analytics
- Enable in Dashboard → Analytics
- Track API response times
- Monitor error rates

### Logs
```bash
# View real-time logs
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

## Cost Considerations

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless function executions
- ✅ Automatic HTTPS
- ✅ Preview deployments

### Potential Costs:
- Bandwidth over 100GB
- Serverless function execution time (1000 GB-hours free)
- Team features (Pro plan: $20/month)

## Security Best Practices

1. **Never commit secrets** - Use Vercel environment variables
2. **Enable CORS properly** - Restrict to your frontend domain
3. **Use HTTPS only** - Vercel provides this automatically
4. **Rotate API keys** - If exposed, regenerate immediately
5. **Monitor logs** - Check for suspicious activity

## Rollback

If deployment fails:
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]
```

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Python on Vercel: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/

---

**Ready to deploy?** Run `vercel --prod` from your project root!
