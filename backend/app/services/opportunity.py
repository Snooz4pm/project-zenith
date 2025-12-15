
def score_opportunity(avg_price, supplier_count, listing_count):
    """
    Lower supply + healthy price = higher opportunity
    """
    if listing_count == 0:
        return 0

    # Ensure we don't divide by zero
    supply_pressure = supplier_count / listing_count
    
    # Cap price signal to 1 (e.g., $50 item gets 1.0)
    price_signal = min(avg_price / 50, 1) 

    # Opportunity Score
    score = (1 - supply_pressure) * 70 + price_signal * 30
    
    # Ensure non-negative
    return round(max(score, 0), 2)

def confidence_level(listing_count):
    """
    Determines confidence based on sample size (listing count).
    """
    if listing_count > 40: return "HIGH"
    elif listing_count > 15: return "MEDIUM"
    else: return "LOW"

def red_ocean(listing_count, supplier_count):
    """
    Detects if the market is over-saturated with suppliers.
    """
    if listing_count == 0: return False
    
    # If there are almost as many suppliers as listings, it's very competitive/fragmented
    if supplier_count / listing_count > 0.7:
        return True
    return False
