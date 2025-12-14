import os
from dotenv import load_dotenv


def verify_environment():
    # Explicitly look in current directory
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    print(f"Looking for .env at: {env_path}")
    print(f"File exists: {os.path.exists(env_path)}")
    load_dotenv(dotenv_path=env_path)
    
    fmp_key = os.getenv("FMP_API_KEY")
    db_url = os.getenv("NEON_DATABASE_URL")
    
    if not fmp_key:
        print("WARNING: FMP_API_KEY is missing in .env")
    else:
        # Show first 4 chars only for security
        masked_key = f"{fmp_key[:4]}..." if len(fmp_key) >= 4 else "****"
        print(f"FMP Key Check: {masked_key}")
    
    if not db_url:
        print("WARNING: NEON_DATABASE_URL is missing in .env")
    else:
        print("Database URL found.")
        
    if fmp_key and db_url:
        print("Keys Loaded. Environment Secure.")

if __name__ == "__main__":
    verify_environment()
