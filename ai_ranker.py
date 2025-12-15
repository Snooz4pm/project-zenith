"""
🤖 AI RANKING & ANALYSIS MODULE
Uses LLM to generate summaries and importance scores
"""

import os
from dotenv import load_dotenv
import json
import time

load_dotenv()

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  google-generativeai not installed. AI ranking disabled.")


class AIRanker:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if GEMINI_AVAILABLE and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.enabled = True
            print("✅ AI Ranker initialized with Gemini")
        else:
            self.enabled = False
            print("⚠️  AI Ranker disabled (missing API key or library)")
    
    def generate_why_it_matters(self, article_data):
        """
        Generate 'Why it matters' summary for an article
        Returns: string summary (2-3 sentences)
        """
        if not self.enabled:
            return "AI ranking not available"
        
        try:
            prompt = f"""
Analyze this news article and explain "Why it matters" in 2-3 concise sentences.
Focus on the real-world impact, implications, and relevance to readers.

Title: {article_data['title']}
Category: {article_data.get('category', 'General')}
Source: {article_data.get('source', 'Unknown')}

Article excerpt:
{article_data['article'][:1000]}

Respond with ONLY the "Why it matters" summary, no preamble.
"""
            
            response = self.model.generate_content(prompt)
            summary = response.text.strip()
            
            # Rate limit: be respectful to API
            time.sleep(1)
            
            return summary
            
        except Exception as e:
            print(f"❌ AI summary generation failed: {e}")
            return "Summary generation failed"
    
    def calculate_ai_importance(self, article_data):
        """
        Calculate AI-based importance score (0.0 to 1.0)
        
        Criteria:
        - Impact: How significant is this news?
        - Novelty: Is this breaking/unique information?
        - Relevance: How broadly does this matter?
        - Urgency: How time-sensitive is this?
        
        Returns: dict with score and breakdown
        """
        if not self.enabled:
            return {
                "importance_score": 0.5,
                "reasoning": "AI ranking not available"
            }
        
        try:
            prompt = f"""
Rate this news article's IMPORTANCE on a scale of 0.0 to 1.0.

Consider:
- Impact: How significant is this event/news?
- Novelty: Is this breaking or unique information?
- Relevance: How broadly does this matter to people?
- Urgency: How time-sensitive is this information?

Title: {article_data['title']}
Category: {article_data.get('category', 'General')}
Source: {article_data.get('source', 'Unknown')}

Article excerpt:
{article_data['article'][:800]}

Respond ONLY with a JSON object in this exact format:
{{
  "importance_score": 0.X,
  "reasoning": "Brief explanation in one sentence"
}}
"""
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Extract JSON from response
            # Sometimes the model wraps it in markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(result_text)
            
            # Validate score
            score = float(result.get("importance_score", 0.5))
            score = max(0.0, min(1.0, score))  # Clamp to 0-1
            
            time.sleep(1)  # Rate limit
            
            return {
                "importance_score": round(score, 2),
                "reasoning": result.get("reasoning", "")
            }
            
        except Exception as e:
            print(f"❌ AI importance calculation failed: {e}")
            return {
                "importance_score": 0.5,
                "reasoning": f"Calculation failed: {str(e)[:100]}"
            }
    
    def rank_articles(self, articles, top_n=10):
        """
        Rank articles by AI importance and add summaries
        
        Args:
            articles: List of article dicts
            top_n: Number of top articles to process with AI
        
        Returns: Ranked list with AI enhancements
        """
        if not self.enabled:
            print("⚠️  AI ranking disabled")
            return articles[:top_n]
        
        print(f"\n🤖 AI RANKING {len(articles)} articles...")
        print("-" * 70)
        
        enhanced_articles = []
        
        for i, article in enumerate(articles, 1):
            print(f"[{i}/{len(articles)}] Analyzing: {article['title'][:50]}...")
            
            # Generate importance score
            importance_result = self.calculate_ai_importance(article)
            article['ai_importance'] = importance_result['importance_score']
            article['ai_reasoning'] = importance_result['reasoning']
            
            # Generate summary (only for top articles to save API calls)
            if i <= top_n:
                summary = self.generate_why_it_matters(article)
                article['why_it_matters'] = summary
                print(f"   ✅ Importance: {article['ai_importance']:.2f}")
                print(f"   📝 Summary: {summary[:80]}...")
            else:
                article['why_it_matters'] = ""
            
            enhanced_articles.append(article)
        
        # Sort by AI importance
        enhanced_articles.sort(key=lambda x: x['ai_importance'], reverse=True)
        
        print(f"\n✅ AI ranking complete!")
        print(f"🏆 Top 3 by AI importance:")
        for i, article in enumerate(enhanced_articles[:3], 1):
            print(f"{i}. [{article['ai_importance']:.2f}] {article['title'][:60]}...")
        
        return enhanced_articles
    
    def generate_daily_digest(self, articles_by_category, date):
        """
        Generate a daily digest summary across all categories
        
        Returns: Markdown formatted digest
        """
        if not self.enabled:
            return "# Daily Digest\n\nAI digest generation not available."
        
        digest_parts = [f"# 📰 News Signal Daily Digest - {date}\n"]
        
        for category, articles in articles_by_category.items():
            if not articles:
                continue
            
            digest_parts.append(f"\n## {category}\n")
            
            # Top 3 articles per category
            for article in articles[:3]:
                digest_parts.append(f"**{article['title']}** ({article['source']})")
                if 'why_it_matters' in article and article['why_it_matters']:
                    digest_parts.append(f"\n*{article['why_it_matters']}*\n")
                digest_parts.append(f"[Read more]({article['url']})\n")
        
        return "\n".join(digest_parts)


# 🧪 TEST
if __name__ == "__main__":
    ranker = AIRanker()
    
    if ranker.enabled:
        # Test article
        test_article = {
            'title': "OpenAI Announces GPT-5 with Revolutionary Capabilities",
            'article': "OpenAI today unveiled GPT-5, marking a significant leap in artificial intelligence. The new model demonstrates unprecedented reasoning abilities, multimodal understanding, and real-time learning capabilities. Industry experts predict this will transform how businesses operate and could accelerate AGI development. The model will be available to enterprise customers starting next month.",
            'category': 'Technology',
            'source': 'techcrunch.com',
            'url': 'https://example.com/article'
        }
        
        print("\n🧪 Testing AI Ranking Module\n")
        
        # Test importance scoring
        print("1️⃣ Calculating Importance Score...")
        importance = ranker.calculate_ai_importance(test_article)
        print(f"\n   Score: {importance['importance_score']}")
        print(f"   Reasoning: {importance['reasoning']}")
        
        # Test summary generation
        print("\n2️⃣ Generating 'Why It Matters' Summary...")
        summary = ranker.generate_why_it_matters(test_article)
        print(f"\n   {summary}")
        
    else:
        print("\n⚠️  Set GEMINI_API_KEY in .env to test AI ranking")
