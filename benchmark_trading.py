import requests
import time
import random
import concurrent.futures

API_URL = "https://defioracleworkerapi.vercel.app/api/v1/trading"

def run_stress_test(num_trades=50):
    print(f"🚀 Starting Stress Test: {num_trades} trades...")
    
    # 1. Register Session
    try:
        resp = requests.post(f"{API_URL}/register")
        if resp.status_code != 200:
            print("❌ Failed to register session. Is the server running on localhost:8000?")
            return
        
        session_id = resp.json()['session_id']
        print(f"✅ Created Session: {session_id}")
        
        # 2. Get Assets
        assets = requests.get(f"{API_URL}/assets").json()['data']
        symbols = [a['symbol'] for a in assets]
        
        start_time = time.time()
        
        def execute_trade(i):
            symbol = random.choice(symbols)
            trade_type = random.choice(['buy', 'buy', 'buy', 'sell']) # Bias towards buy
            quantity = random.uniform(0.1, 1.0)
            
            payload = {
                "session_id": session_id,
                "symbol": symbol,
                "trade_type": trade_type,
                "order_type": "market",
                "quantity": quantity,
                "leverage": 1
            }
            
            try:
                r = requests.post(f"{API_URL}/trade", json=payload)
                if r.status_code == 200:
                    print(f"✅ T{i+1}: {trade_type.upper()} {symbol} - OK")
                    return True
                else:
                    print(f"❌ T{i+1}: Failed - {r.text}")
                    return False
            except Exception as e:
                print(f"❌ T{i+1}: Error - {e}")
                return False

        # Run in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(execute_trade, range(num_trades)))
        
        success_count = sum(results)
        fail_count =  num_trades - success_count
        
        duration = time.time() - start_time
        tps = num_trades / duration
        
        print("\n════════════════════════════════════")
        print("      STRESS TEST RESULTS           ")
        print("════════════════════════════════════")
        print(f"Total Trades: {num_trades}")
        print(f"Successful:   {success_count}")
        print(f"Failed:       {fail_count}")
        print(f"Duration:     {duration:.2f}s")
        print(f"Throughput:   {tps:.2f} trades/sec")
        print("════════════════════════════════════")
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    run_stress_test()
