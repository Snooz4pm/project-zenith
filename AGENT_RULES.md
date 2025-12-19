# 🚨 MANDATORY AGENT RULES — READ BEFORE ANY CODE CHANGES

**This file MUST be read and followed by ALL AI agents working on this codebase.**

---

## ⛔ STOP — PRE-CHANGE CHECKLIST

Before making ANY edit, the agent MUST:

1. [ ] State the exact file(s) being modified
2. [ ] Explain what changes will be made
3. [ ] Explain why the change is necessary
4. [ ] List what could break if done incorrectly
5. [ ] **WAIT FOR USER APPROVAL** on critical files

---

## 🔒 PROTECTED FILES (Require Explicit Permission)

Do NOT modify these without explicit user approval:

| File | Reason |
|------|--------|
| `api/auth/[...nextauth]/route.ts` | Auth configuration |
| `prisma/schema.prisma` | Database schema |
| `package.json` | Dependencies |
| `package-lock.json` | Dependency lock |
| `.env` / `.env.local` | Secrets |
| `next.config.js` | Build configuration |

---

## ❌ FORBIDDEN ACTIONS

| Action | Consequence |
|--------|-------------|
| Creating root `/api` folder | Shadows Next.js auth routes, breaks OAuth |
| Upgrading Next.js | Auth can silently break |
| Using `bcrypt` | Fails on Vercel serverless |
| Assuming Prisma tables exist | Auth failures |
| Deleting code without showing diff | Data loss |
| Auto-running destructive commands | Irreversible damage |

---

## ✅ MANDATORY VERIFICATION

After ANY edit:

```bash
npm run build
```

For auth changes:
```bash
npm run dev
# Then manually verify login flow works
```

---

## 🛡️ SAFETY PROTOCOL

1. **Ask before acting** on protected files
2. **Show diffs** before applying changes
3. **Verify locally** before claiming success
4. **Never assume** — always check

---

## 📋 QUICK REFERENCE

```
Next.js version: 14.2.21 (LOCKED)
Password hashing: bcryptjs (NOT bcrypt)
Database: Neon Postgres (prisma db push after schema changes)
Auth: NextAuth with Google + Credentials
```

---

**If you break these rules, auth will fail, deploys will break, and debugging will take hours.**

Read. Respect. Build safely.
