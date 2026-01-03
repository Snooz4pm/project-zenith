# 🚀 PRE-PUSH CHECKLIST

## ✅ COMPLETED (Ready to Push)

- [x] ✅ Database migration completed (`npx prisma db push`)
- [x] ✅ Old arena page backed up (`page-old-simulated-backup.tsx`)
- [x] ✅ New arena page deployed (`page.tsx`)
- [x] ✅ Old components archived (`components/arena/archive/`)
- [x] ✅ Old API routes archived (`app/api/arena/archive/`)
- [x] ✅ Old lib files archived (`lib/arena/archive/`)
- [x] ✅ Git commit created with comprehensive message
- [x] ✅ All changes staged

---

## ⚠️ BEFORE PUSHING - VERIFY THESE

### 1. Environment Variables Ready

Make sure you have these values ready for Vercel:

```bash
# Get from https://0x.org/docs/introduction/getting-started
ZEROX_API_KEY="your-0x-api-key"

# YOUR wallet address (where fees will go)
NEXT_PUBLIC_AFFILIATE_WALLET="0xYourWalletAddress"
```

**CRITICAL:**
- DO NOT use test addresses
- Use a wallet YOU control
- Hardware wallet recommended for production
- This wallet will receive 0.4% of EVERY swap

### 2. 0x API Key Status

- [ ] Have you created a 0x account?
- [ ] Have you obtained an API key?
- [ ] Is the API key for the correct environment (production)?
- [ ] Free tier = 1,000 requests/month (upgrade for production)

**Get your key:** https://0x.org/docs/introduction/getting-started

### 3. Affiliate Wallet Security

- [ ] Do you have access to this wallet?
- [ ] Have you backed up the private key/seed phrase?
- [ ] Is it a secure wallet (not MetaMask hot wallet for large amounts)?
- [ ] Have you written down the address correctly?

**Test it:** Send 0.001 ETH to verify you control it

---

## 🚀 PUSH TO PRODUCTION

### Step 1: Push to GitHub

```bash
git push origin main
```

This will trigger auto-deployment on Vercel (if connected).

### Step 2: Add Environment Variables to Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following:

```
ZEROX_API_KEY = your-0x-api-key
NEXT_PUBLIC_AFFILIATE_WALLET = 0xYourWalletAddress
```

5. Redeploy if already deployed

### Step 3: Test on Production

After deployment:

1. **Visit your arena:**
   ```
   https://yourdomain.com/arena
   ```

2. **Check discovery feed:**
   - Tokens should load within 10 seconds
   - Should show "Early Discovery" section
   - Tokens should have age, liquidity, signals

3. **Connect wallet:**
   - Click "Connect Wallet"
   - Select MetaMask or WalletConnect
   - Should show connected address

4. **Get a quote:**
   - Select a token from discovery
   - Enter amount (e.g., 0.01 ETH)
   - Should fetch quote within 5 seconds
   - Should show price impact, fees

5. **Execute a small test swap:**
   - Use a small amount ($5-10)
   - Confirm in wallet
   - Wait for transaction
   - Check block explorer
   - Verify success state

6. **Verify fee in database:**
   ```sql
   SELECT * FROM "ArenaSwap" ORDER BY createdAt DESC LIMIT 1;
   ```

   Should show:
   - `affiliateFee` value (~0.4% of swap)
   - `txHash` matching explorer
   - `txStatus` = 'pending' or 'confirmed'

7. **Check affiliate wallet:**
   - Go to https://debank.com
   - Enter your `NEXT_PUBLIC_AFFILIATE_WALLET`
   - Should see token balance (may take a few minutes)

---

## 📊 POST-DEPLOYMENT MONITORING

### First 24 Hours:

**Check these metrics:**

```sql
-- Total swaps
SELECT COUNT(*) FROM "ArenaSwap";

-- Total revenue
SELECT SUM(affiliateFee) FROM "ArenaSwap" WHERE txStatus = 'confirmed';

-- Most popular tokens
SELECT buyToken, COUNT(*) as swaps
FROM "ArenaSwap"
GROUP BY buyToken
ORDER BY swaps DESC;

-- Most popular chains
SELECT chainName, COUNT(*) as swaps, SUM(affiliateFee) as revenue
FROM "ArenaSwap"
WHERE txStatus = 'confirmed'
GROUP BY chainName;
```

**Monitor for errors:**
- Check Vercel logs
- Check browser console
- Check for failed transactions
- Check for API errors

### First Week:

**Key metrics:**
- Daily swap count
- Daily revenue
- User retention (repeat swappers)
- Chain distribution
- Error rate

**Optimize based on data:**
- If no tokens found: Loosen discovery filters
- If high error rate: Check 0x API limits
- If low volume: Improve discovery quality
- If high gas costs: Add L2 chains

---

## 🎯 SUCCESS CRITERIA

### Week 1 Goals:

- [ ] At least 10 successful swaps executed
- [ ] Affiliate fees appearing in wallet
- [ ] Zero critical errors in production
- [ ] Swaps across at least 2 chains
- [ ] Users returning for multiple swaps

### Month 1 Goals:

- [ ] 100+ swaps executed
- [ ] $100+ in affiliate fees earned
- [ ] Consistent daily swap activity
- [ ] Users discovering platform organically
- [ ] Positive user feedback

---

## 🚨 ROLLBACK PLAN (If Needed)

If something goes wrong in production:

```bash
# 1. Restore old arena page
cd zenithscores-frontend/app/arena
mv page.tsx page-new-backup.tsx
mv page-old-simulated-backup.tsx page.tsx

# 2. Restore old components
mv components/arena/archive/* components/arena/

# 3. Restore old API routes
mv app/api/arena/archive/* app/api/arena/

# 4. Commit and push
git add -A
git commit -m "revert: restore simulated trading arena temporarily"
git push origin main

# 5. Later: Fix issues and re-deploy new system
```

---

## 📞 NEED HELP?

**Common Issues:**

1. **"No tokens found"**
   - Normal! Discovery filters are strict
   - Wait 5-10 minutes or loosen filters

2. **"Failed to get quote"**
   - Check `ZEROX_API_KEY` is set in Vercel
   - Check 0x API status: https://status.0x.org

3. **"Transaction failed"**
   - Check user has sufficient balance
   - Check gas prices aren't too high
   - Verify token liquidity

4. **"Affiliate fee not showing"**
   - Fees may take several minutes to appear
   - Check correct chain in wallet
   - Verify `NEXT_PUBLIC_AFFILIATE_WALLET` is correct

**Documentation:**
- Full guide: [ARENA_DEPLOYMENT.md](./ARENA_DEPLOYMENT.md)
- Migration: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- Summary: [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

---

## ✅ FINAL CHECKLIST

Before typing `git push`:

- [ ] Have you read this entire checklist?
- [ ] Do you have your 0x API key ready?
- [ ] Do you have your affiliate wallet address ready?
- [ ] Have you tested the wallet to ensure you control it?
- [ ] Are you ready to add env vars to Vercel immediately after push?
- [ ] Do you understand the revenue model (0.4% per swap)?
- [ ] Are you prepared to monitor the first swaps?

---

## 🎉 READY TO PUSH?

If all checkboxes above are checked, you're ready!

```bash
git push origin main
```

**Then immediately:**
1. Add environment variables to Vercel
2. Visit production URL
3. Test a small swap
4. Monitor for first hour
5. Verify fees appearing

**Good luck! 🚀💰**

---

## 📈 AFTER SUCCESS

Once you have 10+ successful swaps:

1. **Market it:**
   - Share on Twitter
   - Post in crypto Discord servers
   - Share on Reddit (r/CryptoMoonShots)

2. **Optimize:**
   - A/B test discovery filters
   - Add more chains if needed
   - Improve UX based on feedback

3. **Scale:**
   - Upgrade 0x API plan if hitting limits
   - Monitor database usage
   - Consider adding features (alerts, favorites)

4. **Celebrate:**
   - You built a REAL product
   - You're earning REAL revenue
   - Every swap = money in YOUR wallet

**Make it count.** 💪
