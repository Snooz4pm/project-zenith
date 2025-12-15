import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

HEADERS = {
    "User-Agent": "NewsSignalBot/1.0 (respectful)"
}

# 🏷️ CATEGORY KEYWORDS (extensible)
CATEGORY_KEYWORDS = {
    "Technology": [
        "ai", "artificial intelligence", "tech", "software", "hardware", 
        "startup", "silicon valley", "cryptocurrency", "blockchain", "robot",
        "machine learning", "data", "cloud", "cyber", "digital", "app",
        "innovation", "coding", "programming", "internet", "web3"
    ],
    "Business": [
        # Financial & Market Terms
        "market", "stock", "economy", "finance", "investment", "trade",
        "earnings", "shares", "investor", "dividend", "quarterly",
        "fiscal year", "revenue growth", "profit margin", "ipo", "market cap",
        # Corporate & Company
        "company", "corporate", "revenue", "profit", "merger", "acquisition",
        "ceo", "executive", "board", "shareholder", "venture capital",
        "private equity", "valuation", "business strategy",
        # Industry & Commerce
        "retail", "consumer", "manufacturing", "supply chain", "logistics",
        "industrial", "commodity", "bond", "equity", "portfolio",
        "asset", "liability", "balance sheet", "cash flow", "ebitda",
        # Banking & Finance
        "bank", "banking", "financial services", "credit", "debt",
        "interest rate", "federal reserve", "central bank", "inflation",
        "treasury", "securities", "hedge fund", "mutual fund"
    ],
    "Politics": [
        "election", "government", "congress", "senate", "president", "policy",
        "legislation", "vote", "political", "democrat", "republican", "minister",
        "parliament", "law", "regulation", "campaign"
    ],
    "Entertainment": [
        "movie", "film", "music", "celebrity", "actor", "actress", "tv show",
        "series", "netflix", "hollywood", "streaming", "concert", "album",
        "award", "oscar", "grammy"
    ],
    "Sports": [
        "football", "basketball", "soccer", "baseball", "tennis", "nba", "nfl",
        "world cup", "olympics", "championship", "tournament", "athlete", "player",
        "game", "team", "score", "match", "league"
    ],
    "Health": [
        "medical", "health", "disease", "vaccine", "doctor", "hospital",
        "wellness", "fitness", "nutrition", "mental health", "covid", "pandemic",
        "treatment", "diagnosis", "patient", "medicine"
    ],
    "Science": [
        "research", "study", "scientist", "discovery", "climate", "space",
        "nasa", "environment", "experiment", "theory", "physics", "chemistry",
        "biology", "astronomy", "laboratory"
    ],
    "World": [
        "international", "global", "foreign", "war", "conflict", "crisis",
        "united nations", "diplomacy", "relation", "country", "nation", "refugee"
    ]
}

# 🌐 DOMAIN-BASED CATEGORY HINTS
# Known news domains with their primary categories
DOMAIN_HINTS = {
    # Business/Finance
    "cnbc.com": "Business",
    "bloomberg.com": "Business",
    "marketwatch.com": "Business",
    "fool.com": "Business",
    "seekingalpha.com": "Business",
    "wsj.com": "Business",
    "ft.com": "Business",
    # Technology
    "techcrunch.com": "Technology",
    "theverge.com": "Technology",
    "wired.com": "Technology",
    "arstechnica.com": "Technology",
    "cnet.com": "Technology",
    "gizmodo.com": "Technology",
    # Sports
    "espn.com": "Sports",
    "si.com": "Sports",
    "bleacherreport.com": "Sports",
    # Entertainment
    "variety.com": "Entertainment",
    "hollywoodreporter.com": "Entertainment",
    "ew.com": "Entertainment",
}


def detect_category(title, article_text, url=None, source=None):
    """
    Detect article category based on keyword matching with domain hints.
    Returns (category, confidence_score, matched_keywords)
    """
    combined_text = f"{title} {article_text}".lower()
    
    category_scores = {}
    
    # 1️⃣ Keyword-based scoring
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        matched_keywords = []
        
        for keyword in keywords:
            # Count occurrences of each keyword
            count = len(re.findall(r'\b' + re.escape(keyword.lower()) + r'\b', combined_text))
            if count > 0:
                score += count
                matched_keywords.append(keyword)
        
        if score > 0:
            category_scores[category] = {
                "score": score,
                "matched": matched_keywords
            }
    
    # 2️⃣ Apply domain hint boost (if available)
    if source and source in DOMAIN_HINTS:
        hint_category = DOMAIN_HINTS[source]
        boost_amount = 10  # Add bonus points to domain's primary category
        
        if hint_category in category_scores:
            category_scores[hint_category]["score"] += boost_amount
        else:
            category_scores[hint_category] = {
                "score": boost_amount,
                "matched": ["[domain hint]"]
            }
    
    # 3️⃣ URL path analysis boost
    if url:
        url_lower = url.lower()
        for category in CATEGORY_KEYWORDS.keys():
            # Check if category name appears in URL path
            if f"/{category.lower()}/" in url_lower or f"/{category.lower()}" in url_lower:
                if category in category_scores:
                    category_scores[category]["score"] += 5
                else:
                    category_scores[category] = {
                        "score": 5,
                        "matched": ["[url hint]"]
                    }
    
    if not category_scores:
        return "General", 0.0, []
    
    # Get top category
    top_category = max(category_scores.items(), key=lambda x: x[1]["score"])
    category_name = top_category[0]
    score_data = top_category[1]
    
    # Filter out hint markers from matched keywords
    matched_keywords = [kw for kw in score_data["matched"] if not kw.startswith("[")]
    
    # Calculate confidence (normalized, capped at 1.0)
    total_score = sum(cat["score"] for cat in category_scores.values())
    confidence = min(score_data["score"] / total_score, 1.0) if total_score > 0 else 0.0
    
    return category_name, confidence, matched_keywords


def scrape_article(url):
    """
    Enhanced article scraper with category detection.
    """
    # 1️⃣ Fetch
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    html = response.text

    soup = BeautifulSoup(html, "html.parser")

    # 2️⃣ TITLE (try h1 first, fallback to title tag)
    title = None
    if soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)
    elif soup.title:
        title = soup.title.get_text(strip=True)
    else:
        title = "Unknown Title"

    # 3️⃣ ARTICLE TEXT (generic approach)
    paragraphs = []

    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if len(text) > 50:  # ignore nav / junk
            paragraphs.append(text)

    article_text = " ".join(paragraphs[:40])  # limit size

    # 4️⃣ SOURCE (domain)
    source = urlparse(url).netloc.replace("www.", "")

    # 5️⃣ CATEGORY DETECTION (with domain hints!)
    category, confidence, matched_keywords = detect_category(title, article_text, url, source)

    return {
        "title": title,
        "article": article_text,
        "source": source,
        "url": url,
        "category": category,
        "category_confidence": round(confidence, 2),
        "matched_keywords": matched_keywords[:5]  # top 5 matched keywords
    }


# 🧪 TEST IT
if __name__ == "__main__":
    # Test with multiple URLs
    test_urls = [
        "https://www.bbc.com/news/technology",
        "https://www.reuters.com/business/",
    ]
    
    for url in test_urls:
        try:
            print(f"\n{'='*60}")
            print(f"🔍 SCRAPING: {url}")
            print(f"{'='*60}")
            
            data = scrape_article(url)
            
            print(f"\n📰 TITLE:\n   {data['title']}")
            print(f"\n🏢 SOURCE:\n   {data['source']}")
            print(f"\n🏷️  CATEGORY:\n   {data['category']} (confidence: {data['category_confidence']})")
            print(f"\n🔑 MATCHED KEYWORDS:\n   {', '.join(data['matched_keywords'])}")
            print(f"\n📄 ARTICLE PREVIEW:\n   {data['article'][:300]}...")
            
        except Exception as e:
            print(f"\n❌ Error scraping {url}: {str(e)}")
