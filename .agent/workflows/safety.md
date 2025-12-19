---
description: Safety checks and approval gates before any code changes
---

# Safety Workflow

## Pre-Edit Requirements

1. **State Intent First**: Before editing ANY file, clearly state:
   - What file you're changing
   - What specific changes you're making
   - Why this change is necessary
   - What could break if done wrong

2. **Request Approval**: Wait for explicit user approval before applying changes to critical files.

## Protected Files (NEVER touch without explicit permission)

- `/api/auth/[...nextauth]/route.ts`
- `prisma/schema.prisma`
- `package.json` / `package-lock.json`
- `.env` / `.env.local`
- `next.config.js`
- Any file containing `NEXTAUTH_SECRET` or database credentials

## Post-Edit Verification

// turbo
3. After any code edit, run: `npm run build`

4. For auth-related changes, manually verify:
   - Dev server starts: `npm run dev`
   - Login flow works
   - Callback redirects correctly

## Forbidden Actions

- ❌ Never create a root `/api` folder (shadows Next.js routes)
- ❌ Never upgrade Next.js without explicit review
- ❌ Never use `bcrypt` (use `bcryptjs` instead)
- ❌ Never assume Prisma migrations ran—verify tables exist
- ❌ Never delete working code without showing the diff first
- ❌ Never run destructive database commands without approval

## When In Doubt

- Ask the user before proceeding
- Show the exact diff/changes planned
- Verify locally before claiming something works
