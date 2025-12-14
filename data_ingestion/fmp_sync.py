import os
import requests
from dotenv import load_dotenv

# Ensure env vars are loaded
load_dotenv()

def fetch_market_proxies():
    api_key = os.getenv('FMP_API_KEY')
    if not api_key:
        print("Error: FMP_API_KEY not found.")
        return {}, {}

    # FMP Endpoints
    # VIX Index (using quote endpoint for current value or historical if needed)
    # Using quote for latest VIX value as a simple check
    vix_url = f"https://financialmodelingprep.com/api/v3/quote/^VIX?apikey={api_key}"
    
    # SPY Historical Data (for SMA calc)
    spy_url = f"https://financialmodelingprep.com/api/v3/historical-price-full/SPY?apikey={api_key}"


    print(f"Fetching VIX from: {vix_url.replace(api_key, 'HIDDEN')}")
    print(f"Fetching SPY from: {spy_url.replace(api_key, 'HIDDEN')}")

    # Sanity Check
    try:
        test_url = f"https://financialmodelingprep.com/api/v3/quote/AAPL?apikey={api_key}"
        test_resp = requests.get(test_url)
        if test_resp.status_code == 200 and test_resp.json():
             print("Sanity Check (AAPL) Passed: API Key is Valid.")
        else:
             print(f"Sanity Check Failed: {test_resp.status_code} - {test_resp.text[:50]}...")
    except:
        pass

    try:
        vix_response = requests.get(vix_url)
        spy_response = requests.get(spy_url)

        if vix_response.status_code == 200:
            vix_data = vix_response.json()
            if vix_data: # Check if list is not empty
                print("FMP VIX Data Test Successful.")
            else:
                print("FMP VIX Data returned empty list.")
        else:
            print(f"VIX Fetch Failed: {vix_response.status_code} - {vix_response.text}")


        if spy_response.status_code == 200:
             # SPY historical returns a large JSON usually under 'historical' key
            spy_data = spy_response.json()
            if 'historical' in spy_data:
                print("FMP SPY Data Test Successful (History found).")
            elif 'symbol' in spy_data: # Sometimes returns just symbol info if error/limit
                 print(f"FMP SPY Data Response: {str(spy_data)[:100]}...")
        else:
             print(f"SPY Fetch Failed: {spy_response.status_code} - {spy_response.text}")


        return vix_response.json(), spy_response.json()

    except Exception as e:
        print(f"Error fetching data: {e}")
        return {}, {}

if __name__ == "__main__":
    fetch_market_proxies()
