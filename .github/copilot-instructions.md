# GitHub Copilot Instructions

## Project Context

This is a Next.js 14.2.21 application with NextAuth authentication deployed on Vercel.

## Critical Constraints

1. **Do NOT create a root `/api` folder** - this shadows Next.js API routes and breaks authentication
2. **Do NOT upgrade Next.js** - version 14.2.21 is locked for auth stability
3. **Use `bcryptjs` NOT `bcrypt`** - native binaries fail on Vercel serverless
4. **Always run `npx prisma db push`** after any schema changes
5. **Database is Neon Postgres** - always use `?sslmode=require` in connection string

## Auth Configuration

- NextAuth with Google OAuth and Credentials providers
- `NEXTAUTH_URL` must match production domain exactly
- `signIn()` callbacks must return `true`
- Error page at `/app/auth/error/page.tsx` is mandatory

## Before Suggesting Changes

- Consider if the change affects authentication
- Check if protected files are involved
- Suggest running `npm run build` after changes

## Protected Files

- `api/auth/[...nextauth]/route.ts`
- `prisma/schema.prisma`
- `package.json`
- `.env` files
- `next.config.js`
