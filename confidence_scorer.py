"""
🎯 CONFIDENCE SCORING MODULE
Calculates confidence scores for news articles based on multiple signals
"""

from rss_discovery import NewsDiscovery

class ConfidenceScorer:
    def __init__(self):
        self.discovery = NewsDiscovery()
    
    def calculate_confidence(self, article_data, url=None):
        """
        Calculate overall confidence score for an article
        
        Scoring factors:
        - Source tier: +0.1 to +0.3
        - Category confidence: +0.0 to +0.4 (from classifier)
        - Article length: +0.0 to +0.2
        - Has matched keywords: +0.1
        
        Max score: 1.0
        """
        score = 0.0
        breakdown = {}
        
        # 1️⃣ Source tier boost
        url_to_check = url or article_data.get('url', '')
        tier = self.discovery.get_domain_tier(url_to_check)
        tier_boost = self.discovery.get_tier_boost(tier)
        score += tier_boost
        breakdown['source_tier'] = {
            'tier': tier,
            'boost': tier_boost
        }
        
        # 2️⃣ Category classification confidence
        category_conf = article_data.get('category_confidence', 0.0)
        # Scale to max 0.4
        category_score = min(category_conf * 0.4, 0.4)
        score += category_score
        breakdown['category_classification'] = {
            'raw_confidence': category_conf,
            'scaled_score': category_score
        }
        
        # 3️⃣ Article length quality signal
        article_text = article_data.get('article', '')
        word_count = len(article_text.split())
        
        if word_count >= 500:
            length_score = 0.2
        elif word_count >= 300:
            length_score = 0.15
        elif word_count >= 150:
            length_score = 0.1
        else:
            length_score = 0.05
        
        score += length_score
        breakdown['article_length'] = {
            'word_count': word_count,
            'score': length_score
        }
        
        # 4️⃣ Keyword matching bonus
        matched_keywords = article_data.get('matched_keywords', [])
        if len(matched_keywords) >= 3:
            keyword_score = 0.1
            score += keyword_score
            breakdown['keywords'] = {
                'count': len(matched_keywords),
                'score': keyword_score
            }
        else:
            breakdown['keywords'] = {
                'count': len(matched_keywords),
                'score': 0.0
            }
        
        # Cap at 1.0
        final_score = min(score, 1.0)
        
        return {
            'confidence': round(final_score, 2),
            'breakdown': breakdown,
            'tier': tier,
            'word_count': word_count
        }
    
    def calculate_importance_score(self, article_data, category_saturation=1.0):
        """
        Calculate importance/ranking score
        
        Factors:
        - Base confidence
        - Category saturation (fewer articles in category = higher importance)
        - Recency (newer = higher)
        
        Returns: importance score (0.0 to 1.0)
        """
        confidence_data = self.calculate_confidence(article_data)
        base_confidence = confidence_data['confidence']
        
        # Saturation penalty (if many similar articles exist)
        saturation_factor = 1.0 / max(category_saturation, 1.0)
        saturation_score = min(saturation_factor, 0.3)
        
        # Combine
        importance = base_confidence * 0.7 + saturation_score
        
        return round(min(importance, 1.0), 2)
    
    def rank_articles(self, articles, limit=None):
        """
        Rank multiple articles by confidence
        Returns: sorted list of articles with scores
        """
        ranked = []
        
        for article in articles:
            conf_data = self.calculate_confidence(article)
            article['confidence_score'] = conf_data['confidence']
            article['confidence_breakdown'] = conf_data['breakdown']
            article['source_tier'] = conf_data['tier']
            ranked.append(article)
        
        # Sort by confidence score (highest first)
        ranked.sort(key=lambda x: x['confidence_score'], reverse=True)
        
        if limit:
            return ranked[:limit]
        return ranked
    
    def print_confidence_breakdown(self, article_data, url=None):
        """Print detailed confidence breakdown"""
        result = self.calculate_confidence(article_data, url)
        
        print(f"\n{'='*60}")
        print(f"🎯 CONFIDENCE ANALYSIS")
        print(f"{'='*60}")
        print(f"\nArticle: {article_data.get('title', 'Unknown')[:60]}...")
        print(f"Source: {article_data.get('source', 'Unknown')}")
        print(f"\n📊 Final Confidence: {result['confidence']:.2f}")
        
        print(f"\n🔍 Breakdown:")
        breakdown = result['breakdown']
        
        # Source tier
        tier_data = breakdown['source_tier']
        tier = tier_data['tier']
        tier_str = f"Tier {tier}" if tier else "Not Trusted"
        print(f"   🏆 Source Tier: {tier_str} (+{tier_data['boost']:.2f})")
        
        # Category
        cat_data = breakdown['category_classification']
        print(f"   🏷️  Category Match: {cat_data['raw_confidence']:.2f} → (+{cat_data['scaled_score']:.2f})")
        
        # Length
        length_data = breakdown['article_length']
        print(f"   📝 Article Length: {length_data['word_count']} words (+{length_data['score']:.2f})")
        
        # Keywords
        kw_data = breakdown['keywords']
        print(f"   🔑 Keywords: {kw_data['count']} matched (+{kw_data['score']:.2f})")
        
        print(f"\n{'='*60}\n")
        
        return result


# 🧪 TEST
if __name__ == "__main__":
    scorer = ConfidenceScorer()
    
    # Test article data
    test_article = {
        'title': "AI Breakthrough in Natural Language Processing",
        'article': "Researchers at Stanford University announced " * 50,  # ~300 words
        'source': "bbc.com",
        'url': "https://www.bbc.com/news/technology/ai-breakthrough",
        'category': "Technology",
        'category_confidence': 0.85,
        'matched_keywords': ["ai", "tech", "research", "innovation"]
    }
    
    # Analyze confidence
    scorer.print_confidence_breakdown(test_article)
    
    # Test with different tiers
    print("\n🧪 Testing different source tiers:\n")
    
    test_articles = [
        {**test_article, 'source': 'bbc.com', 'url': 'https://bbc.com/test'},
        {**test_article, 'source': 'cnbc.com', 'url': 'https://cnbc.com/test'},
        {**test_article, 'source': 'mashable.com', 'url': 'https://mashable.com/test'},
    ]
    
    for article in test_articles:
        result = scorer.calculate_confidence(article)
        source = article['source']
        tier = result['tier']
        conf = result['confidence']
        print(f"{source:20} | Tier {tier} | Confidence: {conf:.2f}")
