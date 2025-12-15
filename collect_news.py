"""
🚀 NEWS SIGNAL COLLECTOR
Scrapes news articles and stores them in Neon database
"""

from enhanced_scraper import scrape_article
from news_database import NewsDB
import time

# List of URLs to scrape
NEWS_URLS = [
    # Technology
    "https://www.bbc.com/news/technology",
    "https://techcrunch.com/",
    "https://www.theverge.com/",
    
    # Business
    "https://www.bbc.com/news/business",
    "https://www.cnbc.com/business/",
    
    # Politics
    "https://www.bbc.com/news/politics",
    
    # Entertainment
    "https://variety.com/",
    
    # Sports
    "https://www.bbc.com/sport",
    "https://www.espn.com/",
    
    # Health
    "https://www.bbc.com/news/health",
    
    # World
    "https://www.bbc.com/news/world",
]


def collect_and_store():
    """
    Scrape all news URLs and store in database
    """
    print("\n" + "="*70)
    print("🚀 NEWS SIGNAL COLLECTOR")
    print("="*70)
    
    results = {
        "total": 0,
        "success": 0,
        "failed": 0,
        "stored": 0,
        "duplicates": 0
    }
    
    scraped_articles = []
    
    # Step 1: Scrape all URLs
    print(f"\n📡 Scraping {len(NEWS_URLS)} news sources...")
    print("-" * 70)
    
    for url in NEWS_URLS:
        results["total"] += 1
        
        try:
            # Be respectful - delay between requests
            time.sleep(1)
            
            print(f"\n🔍 Scraping: {url}")
            data = scrape_article(url)
            
            results["success"] += 1
            scraped_articles.append(data)
            
            print(f"✅ Category: {data['category']} ({data['category_confidence']})")
            print(f"   Title: {data['title'][:60]}...")
            
        except Exception as e:
            results["failed"] += 1
            print(f"❌ Failed: {str(e)[:80]}")
    
    # Step 2: Store in database
    if scraped_articles:
        print(f"\n{'='*70}")
        print(f"💾 STORING IN DATABASE ({len(scraped_articles)} articles)")
        print("="*70)
        
        with NewsDB() as db:
            for article in scraped_articles:
                article_id, is_new = db.store_article(article)
                if is_new:
                    results["stored"] += 1
                else:
                    results["duplicates"] += 1
            
            # Show final stats
            print(f"\n{'='*70}")
            print("📊 FINAL STATISTICS")
            print("="*70)
            db.print_stats()
    
    # Print summary
    print(f"\n{'='*70}")
    print("🎯 COLLECTION SUMMARY")
    print("="*70)
    print(f"\n📡 Scraping:")
    print(f"   Total URLs attempted: {results['total']}")
    print(f"   ✅ Successful: {results['success']}")
    print(f"   ❌ Failed: {results['failed']}")
    
    print(f"\n💾 Database:")
    print(f"   ✅ New articles stored: {results['stored']}")
    print(f"   ⚠️  Duplicates skipped: {results['duplicates']}")
    
    print(f"\n{'='*70}\n")
    
    return results


def scrape_single_url(url):
    """
    Scrape a single URL and store it in database
    """
    print(f"\n🔍 Scraping: {url}")
    
    try:
        # Scrape
        data = scrape_article(url)
        
        print(f"✅ Scraped successfully!")
        print(f"   Title: {data['title']}")
        print(f"   Source: {data['source']}")
        print(f"   Category: {data['category']} (confidence: {data['category_confidence']})")
        print(f"   Keywords: {', '.join(data['matched_keywords'][:5])}")
        
        # Store
        with NewsDB() as db:
            article_id, is_new = db.store_article(data)
            
            if is_new:
                print(f"\n✅ Stored in database (ID: {article_id})")
            else:
                print(f"\n⚠️  Article already exists in database (duplicate)")
        
        return data
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Single URL mode
        url = sys.argv[1]
        scrape_single_url(url)
    else:
        # Batch collection mode
        collect_and_store()
