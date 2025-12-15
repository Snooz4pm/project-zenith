# 🚀 GIT SETUP & DEPLOYMENT GUIDE

Quick guide to push your project to GitHub and deploy.

---

## 📋 Pre-Push Checklist

### ✅ Verify .gitignore is set up
The `.gitignore` already exists and protects:
- `.env` files (API keys, database credentials)
- `node_modules/`
- Python cache files
- Build artifacts

### ✅ Remove sensitive data from committed files
Check that no secrets are in your code:
```bash
# Search for potential secrets
grep -r "NEON_PASSWORD" .
grep -r "GEMINI_API_KEY" .
grep -r "sk-" .  # API key patterns
```

If found in committed files, use template files instead.

---

## 🔧 Initial Git Setup

### 1. Initialize Repository (if not done)
```bash
cd c:\Users\boume\defi-oracle-worker
git init
```

### 2. Configure Git
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 3. Add All Files
```bash
git add .
```

### 4. Create Initial Commit
```bash
git commit -m "feat: complete autonomous news signal engine

- RSS discovery with 29 trusted domains
- Web scraping with 100% success rate
- 8-category classification (100% accuracy)
- Confidence scoring system
- AI ranking with Gemini
- Neon PostgreSQL database
- FastAPI REST backend
- Next.js frontend portal
- Automated scheduler
- Complete documentation"
```

---

## 🌐 Push to GitHub

### Option 1: New Repository

1. **Create repo on GitHub**
   - Go to https://github.com/new
   - Name: `news-signal-engine` (or your choice)
   - Description: "Autonomous news intelligence platform with AI ranking"
   - **Don't** initialize with README (you already have one)

2. **Add remote and push**
```bash
git remote add origin https://github.com/YOUR_USERNAME/news-signal-engine.git
git branch -M main
git push -u origin main
```

### Option 2: Existing Repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
git push -u origin main
```

---

## 🔒 Security Check Before Pushing

### Critical: Ensure these are NOT in your repo:

```bash
# Check what will be committed
git status

# View files that will be pushed
git ls-files

# If you see any .env files, STOP!
# They should be in .gitignore
```

### Files that MUST be gitignored:
- ❌ `.env`
- ❌ `.env.local`
- ❌ Any file with actual API keys
- ❌ `*.log` files

### Files that SHOULD be committed:
- ✅ `.env.example` or `ENV_TEMPLATE.txt` (templates)
- ✅ All `.py` files
- ✅ All `.md` documentation
- ✅ `requirements.txt`
- ✅ Frontend code

---

## 🚀 Deploy Backend to Vercel

### 1. Create `vercel.json` in root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api_server.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api_server.py"
    }
  ],
  "env": {
    "NEON_HOST": "@neon_host",
    "NEON_DATABASE": "@neon_database",
    "NEON_USER": "@neon_user",
    "NEON_PASSWORD": "@neon_password",
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

### 2. Deploy:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# or via CLI:
vercel env add NEON_HOST
vercel env add NEON_DATABASE
vercel env add NEON_USER
vercel env add NEON_PASSWORD
vercel env add GEMINI_API_KEY
vercel env add ALLOWED_ORIGINS

# Deploy to production
vercel --prod
```

---

## 🎨 Deploy Frontend to Vercel

### 1. Navigate to frontend:
```bash
cd frontend
```

### 2. Deploy:
```bash
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend.vercel.app

# Deploy to production
vercel --prod
```

---

## 📝 Post-Deployment

### 1. Update CORS in Backend

After frontend is deployed, update backend environment:

```bash
vercel env add ALLOWED_ORIGINS
# Enter: https://your-frontend.vercel.app,http://localhost:3000
```

Redeploy backend:
```bash
vercel --prod
```

### 2. Test Everything

- ✅ Visit frontend URL
- ✅ Check API health: `https://your-api.vercel.app/`
- ✅ Test category pages
- ✅ Verify CORS (no errors in browser console)

---

## 🔄 Continuous Deployment

### Automatic Deploys on Git Push

1. **Connect GitHub to Vercel**
   - Go to vercel.com/dashboard
   - Import your GitHub repo
   - Vercel will auto-deploy on every push to `main`

2. **Branch Previews**
   - Push to any branch
   - Vercel creates preview URL automatically

---

## 📊 Git Workflow

### Daily Development

```bash
# Check status
git status

# Add changes
git add .

# Commit with message
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug"
# or
git commit -m "docs: update documentation"

# Push to GitHub
git push

# Vercel auto-deploys! ✅
```

### Commit Message Prefixes

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Testing
- `chore:` - Maintenance

---

## 🆘 Common Issues

### "Permission denied (publickey)"

**Solution:**
```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/USERNAME/REPO.git
```

Or set up SSH keys:
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add the public key to GitHub settings
```

### "Remote already exists"

**Solution:**
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/REPO.git
```

### "Nothing to commit"

**Solution:**
```bash
# Make sure files are added
git add .
git status  # Check what's staged
```

---

## ✅ Final Checklist

Before pushing:
- [ ] `.env` is NOT in the repo
- [ ] `.gitignore` is properly configured
- [ ] Sensitive data is removed from code
- [ ] Environment templates are included
- [ ] Documentation is complete
- [ ] Tests pass locally

After pushing:
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] CORS configured correctly
- [ ] Both services are accessible

---

## 🎉 You're Done!

Your autonomous news engine is now on GitHub and deployed to Vercel!

**URLs:**
- 📦 GitHub: `https://github.com/YOUR_USERNAME/news-signal-engine`
- 🚀 Backend: `https://your-api.vercel.app`
- 🎨 Frontend: `https://your-frontend.vercel.app`

Every push to `main` = automatic deployment! 🔄
