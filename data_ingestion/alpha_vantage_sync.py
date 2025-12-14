import requests
import os
from dotenv import load_dotenv
import yfinance as yf

load_dotenv()

def fetch_vix_real():
    """
    Fetch real-time VIX data using yfinance (Yahoo Finance).
    Falls back to placeholder if fetch fails.
    """
    try:
        ticker = yf.Ticker("^VIX")
        data = ticker.history(period="1d")
        
        if not data.empty:
            latest_vix = data['Close'].iloc[-1]
            print(f"Real VIX fetched: {latest_vix:.2f}")
            return latest_vix
        else:
            print("VIX fetch returned empty data, using placeholder")
            return 15.0
    except Exception as e:
        print(f"VIX fetch error: {e}, using placeholder")
        return 15.0


def fetch_market_proxies():
    key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not key:
        print("Error: ALPHA_VANTAGE_API_KEY not found.")
        return {}, None
        
    base_url = "https://www.alphavantage.co/query"

    print(f"Using Key ending in: {key[-4:]}")

    # 1. SPY Historical Data

    spy_params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": "SPY",
        "apikey": key
    }
    print("Fetching SPY Data...")
    spy_response = requests.get(base_url, params=spy_params)

    # 2. VIX - Using yfinance for reliable data
    print("Fetching VIX Data (yfinance)...")
    vix_value = fetch_vix_real()

    # Check SPY status
    if spy_response.status_code == 200:
        spy_json = spy_response.json()
        if 'Error Message' not in spy_json:
            print("Alpha Vantage SPY Data Test Successful.")
        else:
            print(f"Alpha Vantage SPY Error: {spy_json['Error Message']}")
    else:
        print(f"Alpha Vantage SPY connection failed: {spy_response.text}")

    return spy_response.json(), vix_value

if __name__ == "__main__":
    fetch_market_proxies()
