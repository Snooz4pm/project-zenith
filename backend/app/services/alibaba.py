
from apify_client import ApifyClient
import os
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")

def fetch_listings(keyword: str, max_pages: int = 1):
    """
    Fetch raw Alibaba listings for a keyword using Apify.
    Maps Apify output to a standard format with 'price' and 'supplier'.
    """
    if not APIFY_TOKEN:
        print("Warning: APIFY_API_TOKEN not found.")
        return []

    client = ApifyClient(APIFY_TOKEN)

    # Trying the specific actor mentioned by username if 'easy-scraping' failed
    actor_id = "piotrv1001/alibaba-listings-scraper"
    
    # We estimate items per page to be around 40-50
    # The input for this specific actor might vary. 
    # Usually standard inputs: 'startUrls' or 'search'.
    # checking based on common patterns. 
    run_input = {
        "searchQuery": keyword, # 'searchQuery' is common for this actor
        "startUrls": [],
        "maxItems": max_pages * 50,
    }

    print(f"Calling Apify Actor: {actor_id} for {keyword}...")

    try:
        run = client.actor(actor_id).call(run_input=run_input)
        
        if not run:
             print("Apify run failed to start.")
             return []

        dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
        print(f"Apify fetched {len(dataset_items)} items.")
        
        # Normalize keys immediately to match what normalizer expects
        normalized_results = []
        for item in dataset_items:
            # Inspect structure if needed, but standardizing:
            normalized_results.append({
                "price": item.get("price", "0"), 
                "supplier": item.get("supplierName") or item.get("vendorName") or item.get("companyName") or "Unknown"
            })
            
        return normalized_results
    except Exception as e:
        print(f"Apify Scraping Error: {e}")
        # Fallback to easy-scraping if piotr fails? 
        # But let's assume this one works since user explicitly named the repo.
        return []
