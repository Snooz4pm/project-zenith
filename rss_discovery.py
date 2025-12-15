"""
📡 RSS DISCOVERY MODULE
Discovers news articles from Google News RSS and other feeds
"""

import feedparser
import requests
from urllib.parse import urlparse, quote
from datetime import datetime, timedelta

# 🌐 TRUSTED NEWS DOMAINS
TRUSTED_DOMAINS = {
    # Tier 1: Most reliable (confidence boost: +0.3)
    "tier1": [
        "bbc.com", "bbc.co.uk",
        "reuters.com",
        "apnews.com",
        "bloomberg.com",
        "wsj.com",
        "ft.com",
        "nytimes.com",
        "washingtonpost.com",
        "theguardian.com",
        "economist.com",
    ],
    # Tier 2: Reliable (confidence boost: +0.2)
    "tier2": [
        "cnbc.com",
        "techcrunch.com",
        "theverge.com",
        "arstechnica.com",
        "wired.com",
        "variety.com",
        "espn.com",
        "cnn.com",
        "forbes.com",
        "businessinsider.com",
    ],
    # Tier 3: Acceptable (confidence boost: +0.1)
    "tier3": [
        "mashable.com",
        "engadget.com",
        "cnet.com",
        "gizmodo.com",
        "polygon.com",
        "ign.com",
        "si.com",
        "bleacherreport.com",
    ]
}

# 🔍 GOOGLE NEWS RSS QUERIES
RSS_QUERIES = {
    "Technology": [
        "artificial intelligence",
        "technology startup",
        "cryptocurrency blockchain",
        "cybersecurity",
        "tech innovation",
    ],
    "Business": [
        "stock market",
        "business economy",
        "corporate merger acquisition",
        "venture capital",
        "financial markets",
    ],
    "Politics": [
        "politics election",
        "government policy",
        "legislation",
    ],
    "Entertainment": [
        "hollywood movies",
        "music industry",
        "entertainment news",
    ],
    "Sports": [
        "sports news",
        "nba nfl",
        "world cup",
    ],
    "Health": [
        "health medical",
        "healthcare",
        "wellness fitness",
    ],
    "Science": [
        "science research",
        "climate change",
        "space exploration",
    ],
    "World": [
        "world news",
        "international",
        "global affairs",
    ]
}


class NewsDiscovery:
    def __init__(self):
        self.all_trusted_domains = self._flatten_domains()
    
    def _flatten_domains(self):
        """Get all trusted domains as a flat list"""
        all_domains = []
        for tier in TRUSTED_DOMAINS.values():
            all_domains.extend(tier)
        return all_domains
    
    def get_domain_tier(self, url):
        """Get tier level for a domain (1, 2, 3, or None)"""
        domain = urlparse(url).netloc.replace("www.", "")
        
        for tier_name, domains in TRUSTED_DOMAINS.items():
            if domain in domains:
                return int(tier_name.replace("tier", ""))
        return None
    
    def get_tier_boost(self, tier):
        """Get confidence boost for tier level"""
        boosts = {
            1: 0.3,
            2: 0.2,
            3: 0.1
        }
        return boosts.get(tier, 0.0)
    
    def is_trusted(self, url):
        """Check if URL is from a trusted domain"""
        domain = urlparse(url).netloc.replace("www.", "")
        return domain in self.all_trusted_domains
    
    def fetch_google_news_rss(self, query, language="en", country="US"):
        """
        Fetch articles from Google News RSS for a specific query
        Returns list of article URLs
        """
        # Google News RSS URL format
        encoded_query = quote(query)
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl={language}&gl={country}&ceid={country}:{language}"
        
        try:
            feed = feedparser.parse(rss_url)
            articles = []
            
            for entry in feed.entries:
                # Google News RSS wraps the actual URL
                # Extract the real URL from the link
                url = entry.link
                
                article_data = {
                    "url": url,
                    "title": entry.get("title", ""),
                    "published": entry.get("published", ""),
                    "source": entry.get("source", {}).get("title", ""),
                }
                
                articles.append(article_data)
            
            return articles
            
        except Exception as e:
            print(f"❌ Error fetching RSS for '{query}': {e}")
            return []
    
    def discover_by_category(self, category, max_per_query=10):
        """
        Discover articles for a specific category
        Returns: list of trusted article URLs
        """
        if category not in RSS_QUERIES:
            print(f"⚠️  Category '{category}' not found")
            return []
        
        queries = RSS_QUERIES[category]
        discovered_urls = []
        
        print(f"\n🔍 Discovering {category} articles...")
        
        for query in queries:
            articles = self.fetch_google_news_rss(query)
            
            # Filter to only trusted domains
            trusted_count = 0
            for article in articles[:max_per_query]:
                if self.is_trusted(article["url"]):
                    discovered_urls.append(article)
                    trusted_count += 1
            
            print(f"   '{query}': found {trusted_count} trusted articles")
        
        # Deduplicate by URL
        unique_urls = {}
        for article in discovered_urls:
            unique_urls[article["url"]] = article
        
        result = list(unique_urls.values())
        print(f"✅ Total unique trusted articles: {len(result)}")
        
        return result
    
    def discover_all_categories(self, max_per_query=10):
        """
        Discover articles across all categories
        Returns: dict of {category: [articles]}
        """
        all_discoveries = {}
        
        print("\n" + "="*70)
        print("📡 NEWS DISCOVERY - ALL CATEGORIES")
        print("="*70)
        
        for category in RSS_QUERIES.keys():
            articles = self.discover_by_category(category, max_per_query)
            all_discoveries[category] = articles
        
        total = sum(len(articles) for articles in all_discoveries.values())
        print(f"\n🎯 Total articles discovered: {total}")
        print("="*70 + "\n")
        
        return all_discoveries
    
    def discover_direct_sources(self):
        """
        Get articles directly from known trusted sources (without Google RSS)
        Returns: list of URLs
        """
        direct_sources = [
            "https://www.bbc.com/news/technology",
            "https://www.bbc.com/news/business",
            "https://www.bbc.com/news/politics",
            "https://www.bbc.com/sport",
            "https://www.bbc.com/news/health",
            "https://www.bbc.com/news/world",
            "https://techcrunch.com/",
            "https://www.theverge.com/",
            "https://www.cnbc.com/business/",
            "https://variety.com/",
            "https://www.espn.com/",
        ]
        
        return [{"url": url, "source": "direct"} for url in direct_sources]


# 🧪 TEST
if __name__ == "__main__":
    discovery = NewsDiscovery()
    
    # Test single category
    print("Testing Technology category discovery...\n")
    tech_articles = discovery.discover_by_category("Technology", max_per_query=5)
    
    print(f"\n📰 Sample discovered articles:")
    for i, article in enumerate(tech_articles[:5], 1):
        tier = discovery.get_domain_tier(article["url"])
        print(f"{i}. {article['title'][:60]}...")
        print(f"   URL: {article['url']}")
        print(f"   Tier: {tier} (boost: +{discovery.get_tier_boost(tier)})")
        print()
    
    # Show domain tier stats
    print("\n🏆 Domain Tier Distribution:")
    tier_counts = {1: 0, 2: 0, 3: 0, None: 0}
    for article in tech_articles:
        tier = discovery.get_domain_tier(article["url"])
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    
    for tier, count in sorted(tier_counts.items()):
        if count > 0:
            tier_name = f"Tier {tier}" if tier else "Other"
            print(f"   {tier_name}: {count} articles")
