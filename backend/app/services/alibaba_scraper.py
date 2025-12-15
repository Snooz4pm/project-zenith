
from apify_client import ApifyClient
import os
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")

def scrape_alibaba_products(keyword: str, max_items: int = 5):
    """
    Scrapes Alibaba using Apify to get product data.
    """
    if not APIFY_TOKEN:
        print("Warning: APIFY_API_TOKEN not found. Returning empty list.")
        return []

    client = ApifyClient(APIFY_TOKEN)

    # Prepare the Actor input
    # Using 'easy-scraping/alibaba-product-scraper' as a reliable standard
    run_input = {
        "search": keyword,
        "maxItems": max_items,
        "language": "en_US",
        "currency": "USD",
        "country": "US"
    }

    try:
        # Run the Actor and wait for it to finish
        # Actor ID: easy-scraping/alibaba-product-scraper
        run = client.actor("easy-scraping/alibaba-product-scraper").call(run_input=run_input)

        # Fetch and return Actor results from the run's dataset (if any)
        dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
        return dataset_items
    except Exception as e:
        print(f"Apify Scraping Error: {e}")
        return []

def calculate_average_price(products: list) -> float:
    """
    Calculates the average price from a list of scraped products.
    Alibaba prices are often ranges (e.g., "$5.00 - $10.00").
    """
    prices = []
    for p in products:
        price_str = p.get("price", "0")
        # specific handling for alibaba scraping output might be needed
        # but for now we try a robust parsing of "min - max" or simple float
        try:
            # Clean string
            clean_price = price_str.replace("US", "").replace("$", "").replace(" ", "")
            if "-" in clean_price:
                parts = clean_price.split("-")
                avg = (float(parts[0]) + float(parts[1])) / 2
                prices.append(avg)
            else:
                prices.append(float(clean_price))
        except:
            continue
            
    if not prices:
        return 0.0
        
    return round(sum(prices) / len(prices), 2)
