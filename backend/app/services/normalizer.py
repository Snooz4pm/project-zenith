
def normalize_listings(raw_listings):
    """
    Convert messy scraper output into clean signals
    """
    prices = []
    suppliers = set()

    for item in raw_listings:
        price_str = item.get("price", "")
        supplier = item.get("supplier")

        # Parsing price logic (handling ranges like '$5.00 - $10.00' or 'US $5.00')
        if price_str:
            try:
                # Basic cleaning suitable for the diverse formats
                clean = price_str.replace("US", "").replace("$", "").replace(" ", "")
                val = 0.0
                if "-" in clean:
                    parts = clean.split("-")
                    # Average of range
                    val = (float(parts[0]) + float(parts[1])) / 2
                else:
                    val = float(clean)
                
                if val > 0:
                    prices.append(val)
            except:
                pass

        if supplier:
            suppliers.add(supplier)

    return {
        "avg_price": sum(prices) / len(prices) if prices else 0,
        "supplier_count": len(suppliers),
        "listing_count": len(raw_listings)
    }
