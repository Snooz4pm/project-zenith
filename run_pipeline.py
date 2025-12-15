"""
🤖 AUTONOMOUS NEWS SIGNAL ENGINE
Complete pipeline: Discovery → Scrape → Classify → Score → Store
"""

from rss_discovery import NewsDiscovery
from enhanced_scraper import scrape_article
from confidence_scorer import ConfidenceScorer
from news_database import NewsDB
import time
from datetime import datetime
import json

class NewsPipeline:
    def __init__(self, delay_between_scrapes=2):
        self.discovery = NewsDiscovery()
        self.scorer = ConfidenceScorer()
        self.delay = delay_between_scrapes
        
        self.stats = {
            'discovered': 0,
            'scraped': 0,
            'failed_scrapes': 0,
            'stored': 0,
            'duplicates': 0,
            'by_category': {},
            'by_tier': {1: 0, 2: 0, 3: 0}
        }
    
    def run_full_pipeline(self, max_per_query=5, categories=None):
        """
        Run complete autonomous pipeline
        
        Args:
            max_per_query: Max articles to discover per RSS query
            categories: List of categories to process, or None for all
        
        Returns: Pipeline statistics
        """
        print("\n" + "="*70)
        print("🤖 AUTONOMOUS NEWS SIGNAL ENGINE")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70)
        
        # Step 1: DISCOVERY
        print("\n📡 PHASE 1: DISCOVERY")
        print("-" * 70)
        
        if categories:
            discovered = {}
            for category in categories:
                discovered[category] = self.discovery.discover_by_category(
                    category, max_per_query
                )
        else:
            discovered = self.discovery.discover_all_categories(max_per_query)
        
        total_discovered = sum(len(articles) for articles in discovered.values())
        self.stats['discovered'] = total_discovered
        
        if total_discovered == 0:
            print("\n⚠️  No articles discovered. Exiting.")
            return self.stats
        
        # Step 2: SCRAPE & CLASSIFY
        print(f"\n🔍 PHASE 2: SCRAPE & CLASSIFY ({total_discovered} articles)")
        print("-" * 70)
        
        all_processed = []
        
        for category, articles in discovered.items():
            print(f"\n📂 Processing {category} ({len(articles)} articles)...")
            
            for i, article_meta in enumerate(articles, 1):
                url = article_meta['url']
                
                try:
                    # Respectful delay
                    if i > 1:
                        time.sleep(self.delay)
                    
                    print(f"   [{i}/{len(articles)}] Scraping: {url[:60]}...")
                    
                    # Scrape
                    scraped_data = scrape_article(url)
                    self.stats['scraped'] += 1
                    
                    # Add to processed list
                    all_processed.append(scraped_data)
                    
                    print(f"      ✅ Category: {scraped_data['category']} "
                          f"({scraped_data['category_confidence']})")
                    
                except Exception as e:
                    self.stats['failed_scrapes'] += 1
                    print(f"      ❌ Failed: {str(e)[:60]}")
        
        # Step 3: CONFIDENCE SCORING
        print(f"\n🎯 PHASE 3: CONFIDENCE SCORING ({len(all_processed)} articles)")
        print("-" * 70)
        
        scored_articles = []
        for article in all_processed:
            confidence_data = self.scorer.calculate_confidence(article)
            
            article['final_confidence'] = confidence_data['confidence']
            article['confidence_breakdown'] = confidence_data['breakdown']
            article['source_tier'] = confidence_data['tier']
            
            scored_articles.append(article)
            
            # Update tier stats
            tier = confidence_data['tier']
            if tier:
                self.stats['by_tier'][tier] = self.stats['by_tier'].get(tier, 0) + 1
        
        # Rank by confidence
        scored_articles.sort(key=lambda x: x['final_confidence'], reverse=True)
        
        print(f"   Top 5 by confidence:")
        for i, article in enumerate(scored_articles[:5], 1):
            tier = article['source_tier']
            conf = article['final_confidence']
            print(f"   {i}. [{tier}] {article['title'][:50]}... (conf: {conf})")
        
        # Step 4: STORE IN DATABASE
        print(f"\n💾 PHASE 4: STORING IN NEON DATABASE")
        print("-" * 70)
        
        with NewsDB() as db:
            for article in scored_articles:
                # Override category_confidence with final_confidence
                article['category_confidence'] = article['final_confidence']
                
                article_id, is_new = db.store_article(article)
                
                if is_new:
                    self.stats['stored'] += 1
                    
                    # Update category stats
                    category = article['category']
                    self.stats['by_category'][category] = \
                        self.stats['by_category'].get(category, 0) + 1
                else:
                    self.stats['duplicates'] += 1
            
            print(f"\n✅ Stored: {self.stats['stored']} new articles")
            print(f"⚠️  Duplicates skipped: {self.stats['duplicates']}")
            
            # Show updated database stats
            print(f"\n💾 UPDATED DATABASE STATISTICS:")
            print("-" * 70)
            db.print_stats()
        
        # Step 5: SUMMARY
        self.print_summary()
        
        return self.stats
    
    def print_summary(self):
        """Print pipeline execution summary"""
        print("\n" + "="*70)
        print("🎯 PIPELINE EXECUTION SUMMARY")
        print("="*70)
        
        print(f"\n📡 Discovery:")
        print(f"   Total articles discovered: {self.stats['discovered']}")
        
        print(f"\n🔍 Scraping:")
        print(f"   ✅ Successful: {self.stats['scraped']}")
        print(f"   ❌ Failed: {self.stats['failed_scrapes']}")
        scrape_rate = (self.stats['scraped'] / max(self.stats['discovered'], 1)) * 100
        print(f"   Success rate: {scrape_rate:.1f}%")
        
        print(f"\n🏆 Source Tier Distribution:")
        for tier in [1, 2, 3]:
            count = self.stats['by_tier'].get(tier, 0)
            pct = (count / max(self.stats['scraped'], 1)) * 100
            print(f"   Tier {tier}: {count} articles ({pct:.1f}%)")
        
        print(f"\n💾 Database:")
        print(f"   ✅ New articles stored: {self.stats['stored']}")
        print(f"   ⚠️  Duplicates skipped: {self.stats['duplicates']}")
        
        if self.stats['by_category']:
            print(f"\n📂 By Category (new articles):")
            for category, count in sorted(
                self.stats['by_category'].items(),
                key=lambda x: x[1],
                reverse=True
            ):
                print(f"   {category:15} {count} articles")
        
        print(f"\n⏰ Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70 + "\n")
    
    def save_stats(self, filepath="pipeline_stats.json"):
        """Save pipeline statistics to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.stats, f, indent=2)
        print(f"📊 Stats saved to: {filepath}")


def run_quick_test():
    """Quick test with limited articles"""
    print("\n🧪 QUICK TEST MODE (Technology only, 3 articles max)\n")
    
    pipeline = NewsPipeline(delay_between_scrapes=1)
    stats = pipeline.run_full_pipeline(
        max_per_query=3,
        categories=['Technology']
    )
    
    return stats


def run_full_collection():
    """Full collection across all categories"""
    pipeline = NewsPipeline(delay_between_scrapes=2)
    stats = pipeline.run_full_pipeline(max_per_query=5)
    pipeline.save_stats()
    
    return stats


def run_category(category_name, max_articles=10):
    """Run pipeline for a single category"""
    print(f"\n🎯 CATEGORY MODE: {category_name}\n")
    
    pipeline = NewsPipeline(delay_between_scrapes=1)
    stats = pipeline.run_full_pipeline(
        max_per_query=max_articles,
        categories=[category_name]
    )
    
    return stats


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "test":
            # Quick test
            run_quick_test()
        
        elif command == "full":
            # Full collection
            run_full_collection()
        
        elif command in ["technology", "business", "politics", "entertainment", 
                        "sports", "health", "science", "world"]:
            # Single category
            max_articles = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            run_category(command.capitalize(), max_articles)
        
        else:
            print(f"❌ Unknown command: {command}")
            print("\nUsage:")
            print("  python run_pipeline.py test          # Quick test")
            print("  python run_pipeline.py full          # Full collection")
            print("  python run_pipeline.py technology 10 # Single category")
    
    else:
        # Default: Quick test
        print("💡 Tip: Use 'python run_pipeline.py full' for full collection")
        run_quick_test()
