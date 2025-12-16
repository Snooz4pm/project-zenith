
import os
from sqlalchemy import create_engine, inspect
from merged_api import Base, ProductOutcome
from dotenv import load_dotenv

load_dotenv()

# Construct URL from NEON vars if DATABASE_URL is missing
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL and os.getenv("NEON_HOST"):
    user = os.getenv("NEON_USER")
    password = os.getenv("NEON_PASSWORD")
    host = os.getenv("NEON_HOST")
    dbname = os.getenv("NEON_DATABASE")
    DATABASE_URL = f"postgresql://{user}:{password}@{host}/{dbname}?sslmode=require"

def check_and_create_zenith_tables():
    print("🔍 Checking Zenith score tables...")
    
    if not DATABASE_URL:
        print("❌ Error: Could not construct DATABASE_URL. Check .env")
        return

    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if "product_outcomes" in tables:
            print("✅ 'product_outcomes' table already exists.")
        else:
            print("⚠️ 'product_outcomes' table MISSING. Creating it now...")
            Base.metadata.create_all(bind=engine)
            print("✅ 'product_outcomes' table created successfully!")

    except Exception as e:
        print(f"❌ Error checking tables: {e}")

if __name__ == "__main__":
    check_and_create_zenith_tables()
