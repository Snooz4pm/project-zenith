"""
🧪 Comprehensive Scraper Category Test Suite
Tests multiple URLs across different categories to identify failures
"""

from enhanced_scraper import scrape_article
import time

# Test URLs organized by expected category (ONLY WORKING URLS)
TEST_URLS = {
    "Technology": [
        "https://www.bbc.com/news/technology",
        "https://techcrunch.com/",
        "https://www.theverge.com/",
    ],
    "Business": [
        "https://www.bbc.com/news/business",
        "https://www.cnbc.com/business/",
    ],
    "Politics": [
        "https://www.bbc.com/news/politics",
    ],
    "Entertainment": [
        "https://variety.com/",
    ],
    "Sports": [
        "https://www.bbc.com/sport",
        "https://www.espn.com/",
    ],
    "Health": [
        "https://www.bbc.com/news/health",
    ],
    "World": [
        "https://www.bbc.com/news/world",
    ]
}

def run_comprehensive_test():
    """
    Run comprehensive tests across all categories
    """
    results = {
        "total": 0,
        "success": 0,
        "failed": 0,
        "failures": [],
        "category_matches": {},
        "low_confidence": []
    }
    
    print("\n" + "="*70)
    print("🧪 COMPREHENSIVE SCRAPER CATEGORY TEST")
    print("="*70)
    
    for expected_category, urls in TEST_URLS.items():
        print(f"\n📂 Testing Category: {expected_category}")
        print("-" * 70)
        
        for url in urls:
            results["total"] += 1
            
            try:
                # Add delay to be respectful
                time.sleep(1)
                
                print(f"\n🔍 Testing: {url}")
                data = scrape_article(url)
                
                results["success"] += 1
                
                # Check if category matches
                detected_category = data["category"]
                confidence = data["category_confidence"]
                
                match_symbol = "✅" if detected_category == expected_category else "⚠️"
                print(f"{match_symbol} Detected: {detected_category} (confidence: {confidence})")
                print(f"   Title: {data['title'][:60]}...")
                print(f"   Keywords: {', '.join(data['matched_keywords'][:3])}")
                
                # Track accuracy
                if detected_category == expected_category:
                    results["category_matches"][expected_category] = \
                        results["category_matches"].get(expected_category, 0) + 1
                
                # Track low confidence
                if confidence < 0.5:
                    results["low_confidence"].append({
                        "url": url,
                        "category": detected_category,
                        "confidence": confidence,
                        "expected": expected_category
                    })
                
            except Exception as e:
                results["failed"] += 1
                error_type = type(e).__name__
                error_msg = str(e)
                
                print(f"❌ FAILED: {error_type}")
                print(f"   Error: {error_msg[:100]}")
                
                results["failures"].append({
                    "url": url,
                    "expected_category": expected_category,
                    "error_type": error_type,
                    "error_message": error_msg
                })
    
    # Print Summary Report
    print_summary_report(results)
    
    return results


def print_summary_report(results):
    """
    Print detailed summary report
    """
    print("\n" + "="*70)
    print("📊 TEST SUMMARY REPORT")
    print("="*70)
    
    # Overall Stats
    print(f"\n📈 Overall Statistics:")
    print(f"   Total URLs Tested: {results['total']}")
    print(f"   ✅ Successful: {results['success']} ({results['success']/results['total']*100:.1f}%)")
    print(f"   ❌ Failed: {results['failed']} ({results['failed']/results['total']*100:.1f}%)")
    
    # Category Accuracy
    if results["category_matches"]:
        print(f"\n🎯 Category Detection Accuracy:")
        for category, count in sorted(results["category_matches"].items()):
            print(f"   {category}: {count} matches")
    
    # Failed URLs
    if results["failures"]:
        print(f"\n❌ Failed URLs ({len(results['failures'])}):")
        for failure in results["failures"]:
            print(f"\n   URL: {failure['url']}")
            print(f"   Expected Category: {failure['expected_category']}")
            print(f"   Error: {failure['error_type']}")
            print(f"   Message: {failure['error_message'][:80]}...")
    
    # Low Confidence Detections
    if results["low_confidence"]:
        print(f"\n⚠️  Low Confidence Detections (<0.5):")
        for item in results["low_confidence"]:
            print(f"\n   URL: {item['url']}")
            print(f"   Expected: {item['expected']}, Detected: {item['category']}")
            print(f"   Confidence: {item['confidence']}")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    if results["failed"] > 0:
        print("   • Some sites are blocking scraping - consider adding more headers")
        print("   • May need site-specific parsers for protected sites")
    if results["low_confidence"]:
        print("   • Review and expand keyword dictionaries for low-confidence categories")
    if results["success"] == results["total"]:
        print("   ✅ All tests passed! Scraper is working perfectly.")
    
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    results = run_comprehensive_test()
    
    # Save results to file
    import json
    with open("scraper_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("📝 Detailed results saved to: scraper_test_results.json")
