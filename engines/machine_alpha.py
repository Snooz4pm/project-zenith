from datetime import datetime
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def calculate_spy_sma(spy_data):
    """
    Parses Alpha Vantage JSON for SPY and calculates 200-day SMA.
    """
    try:
        time_series = spy_data.get("Time Series (Daily)", {})
        if not time_series:
            raise ValueError("No time series data found in response")


        # Sort dates descending (latest first)
        sorted_dates = sorted(time_series.keys(), reverse=True)
        
        # NOTE: Alpha Vantage Free Tier 'Compact' only returns 100 data points.
        # We will adjust to use the maximum available if < 200 for this MVP proof-of-concept.
        available_points = len(sorted_dates)
        if available_points < 50:
             raise ValueError(f"Insufficient data points: {available_points} found")

        # Get latest price
        latest_date = sorted_dates[0]
        latest_close = float(time_series[latest_date]["4. close"])

        # Calculate SMA (using 200 or max available if compact)
        window_size = 200 if available_points >= 200 else available_points
        print(f"Calculating SMA using {window_size} days (Free Tier Limit)")
        
        last_n_dates = sorted_dates[:window_size]
        sum_closes = sum(float(time_series[date]["4. close"]) for date in last_n_dates)
        sma_val = sum_closes / window_size

        return latest_close, sma_val

    except Exception as e:
        print(f"Error calculating SMA: {e}")
        return None, None

def determine_regime(latest_spy, sma_200, vix_value=None):
    """
    Determines Market Regime based on SPY vs SMA200 and VIX.
    """
    if latest_spy is None or sma_200 is None:
        return "UNKNOWN"

    # Use real VIX if available, otherwise use placeholder
    vix_proxy = vix_value if vix_value is not None else 15.0
    
    if vix_value is None:
        print(f"Using VIX placeholder: {vix_proxy}")
    else:
        print(f"Using actual VIX: {vix_proxy}")

    if latest_spy > sma_200 and vix_proxy < 20.0:
        return "BULLISH"
    elif latest_spy < sma_200 and vix_proxy > 20.0:
        return "BEARISH"
    else:
        return "CONSOLIDATION"

def save_regime_result(regime, latest_spy, sma_200, vix_value):
    """
    Persists the regime result to the Neon DB.
    """
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        print("Error: Database URL not configured.")
        return

    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Use current date for the record
        current_date = datetime.now().date()
        timestamp = datetime.now()
        
        # Use placeholder VIX if None is passed, matching logic
        vix_to_store = vix_value if vix_value is not None else 15.0

        query = """
            INSERT INTO market_regime (date, regime, vix_value, spy_sma_200, updated_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (date) 
            DO UPDATE SET 
                regime = EXCLUDED.regime,
                vix_value = EXCLUDED.vix_value,
                spy_sma_200 = EXCLUDED.spy_sma_200,
                updated_at = EXCLUDED.updated_at;
        """
        
        cursor.execute(query, (current_date, regime, vix_to_store, sma_200, timestamp))
        conn.commit()
        
        print(f"Successfully saved regime '{regime}' for {current_date}")
        
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Database Save Error: {e}")

# --- execution block for testing ---
if __name__ == "__main__":
    # Import the sync function to get real data for the test
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from data_ingestion.alpha_vantage_sync import fetch_market_proxies

    print("--- Running Machine Alpha Logic Test ---")
    
    # 1. Fetch Real Data
    spy_data, _ = fetch_market_proxies()
    
    # 2. Calculate Logic
    latest_price, sma = calculate_spy_sma(spy_data)
    
    if latest_price:
        print(f"Latest SPY: ${latest_price:.2f}")
        print(f"200-Day SMA: ${sma:.2f}")
        
        # 3. Determine Regime
        regime = determine_regime(latest_price, sma)
        print(f"Determined Regime: {regime}")
        
        # 4. Save to DB
        save_regime_result(regime, latest_price, sma, 15.0)
    else:
        print("Failed to calculate metrics.")
