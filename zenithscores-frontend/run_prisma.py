import os
import subprocess

env_content = """NEON_HOST=ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech
NEON_DATABASE=neondb
NEON_USER=neondb_owner
NEON_PASSWORD=npg_r2SjAQEbg3De
NEON_PORT=5432
DATABASE_URL="postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="secret-key-change-me-in-prod-12345"
NEXTAUTH_URL="http://localhost:3000"
"""

# Write .env with UTF-8 encoding (no BOM)
with open(".env", "w", encoding="utf-8") as f:
    f.write(env_content)

print("Written .env file")

# Run prisma db push
print("Running prisma db push...")
env = os.environ.copy()
# Explicitly add to env vars just in case
env["DATABASE_URL"] = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

try:
    subprocess.run(["npx", "prisma", "db", "push"], check=True, env=env, shell=True)
    print("Prisma db push successful")
except subprocess.CalledProcessError as e:
    print(f"Error running prisma: {e}")
