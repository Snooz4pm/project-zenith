import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_ingestion.alpha_vantage_sync import fetch_market_proxies
from engines.machine_alpha import calculate_spy_sma, determine_regime, save_regime_result

def sync_pipeline():
    print("Starting Market Regime Sync...")
    load_dotenv()
    
    # 1. Fetch Data
    # fetch_market_proxies now returns (spy_json, vix_float)
    spy_data, vix_val = fetch_market_proxies()
    
    # 2. Logic: SPY SMA
    latest_spy, sma_100 = calculate_spy_sma(spy_data)
    
    if latest_spy is None:
        print("CRITICAL: Failed to calculate SPY metrics. Aborting.")
        return

    print(f"Metric - Latest SPY: {latest_spy}")
    print(f"Metric - SMA (Adapt): {sma_100}")

    # 3. VIX is already extracted as a float from yfinance
    if vix_val is not None:
        print(f"Metric - Latest VIX: {vix_val}")

    # 4. Determine Regime
    regime = determine_regime(latest_spy, sma_100, vix_val)
    print(f"DECISION: Market Regime is {regime}")

    # 5. Persist
    save_regime_result(regime, latest_spy, sma_100, vix_val)
    print("Sync Complete.")

if __name__ == "__main__":
    sync_pipeline()
