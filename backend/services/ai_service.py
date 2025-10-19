import requests
import os
from typing import List, Dict
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.news_api_key = os.getenv("NEWS_API_KEY")  # Alternative news API
        
    async def generate_daily_briefing(self, watchlist) -> Dict:
        """Generate AI daily briefing for a watchlist"""
        try:
            # Get stock tickers from watchlist
            tickers = [stock.ticker for stock in watchlist.stocks]
            
            if not tickers:
                return {
                    "date": datetime.now(),
                    "watchlist_name": watchlist.name,
                    "summary": ["No stocks in watchlist to analyze."],
                    "stocks_analyzed": []
                }
            
            # Fetch news for each stock
            news_data = await self._fetch_news_for_stocks(tickers)
            
            # Generate AI summary
            summary = await self._generate_ai_summary(tickers, news_data)
            
            return {
                "date": datetime.now(),
                "watchlist_name": watchlist.name,
                "summary": summary,
                "stocks_analyzed": tickers
            }
            
        except Exception as e:
            # Return fallback briefing if AI service fails
            return self._get_fallback_briefing(watchlist)
    
    async def _fetch_news_for_stocks(self, tickers: List[str]) -> List[Dict]:
        """Fetch news articles for given stock tickers"""
        try:
            # Using NewsAPI (free tier available)
            url = "https://newsapi.org/v2/everything"
            params = {
                "apiKey": self.news_api_key,
                "q": " OR ".join(tickers),
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 20,
                "from": datetime.now().strftime("%Y-%m-%d")
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "ok":
                return data.get("articles", [])
            else:
                return self._get_mock_news_data(tickers)
                
        except Exception as e:
            return self._get_mock_news_data(tickers)
    
    async def _generate_ai_summary(self, tickers: List[str], news_data: List[Dict]) -> List[str]:
        """Generate AI summary using OpenAI API"""
        try:
            if not self.openai_api_key:
                return self._get_mock_summary(tickers)
            
            # Prepare news content
            news_content = "\n".join([
                f"Headline: {article.get('title', '')}\nDescription: {article.get('description', '')}\n"
                for article in news_data[:10]  # Limit to 10 articles
            ])
            
            # Create prompt for OpenAI
            prompt = f"""
            Analyze the following financial news for these stocks: {', '.join(tickers)}
            
            News:
            {news_content}
            
            Provide a concise 2-3 bullet point summary of the most important developments that could impact these stocks. Focus on:
            - Major company announcements
            - Market-moving news
            - Industry trends affecting these stocks
            
            Format as bullet points, each starting with a dash (-).
            """
            
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 300,
                "temperature": 0.7
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            summary_text = result["choices"][0]["message"]["content"]
            
            # Parse bullet points
            summary_lines = [line.strip() for line in summary_text.split('\n') if line.strip()]
            summary = [line for line in summary_lines if line.startswith('-')]
            
            if not summary:
                return self._get_mock_summary(tickers)
            
            return summary[:3]  # Limit to 3 bullet points
            
        except Exception as e:
            return self._get_mock_summary(tickers)
    
    def _get_mock_news_data(self, tickers: List[str]) -> List[Dict]:
        """Generate mock news data for demo purposes"""
        import random
        
        mock_articles = [
            {
                "title": f"Market Update: {', '.join(tickers)} Stocks Show Mixed Performance",
                "description": f"Trading session analysis for {', '.join(tickers)} with key market insights.",
                "publishedAt": datetime.now().isoformat()
            },
            {
                "title": f"Analyst Upgrades {random.choice(tickers)} to Buy Rating",
                "description": f"Major investment firm raises target price for {random.choice(tickers)} based on strong fundamentals.",
                "publishedAt": datetime.now().isoformat()
            },
            {
                "title": f"Tech Sector Shows Resilience Amid Market Volatility",
                "description": f"Technology stocks including {', '.join(tickers[:3])} demonstrate strong fundamentals.",
                "publishedAt": datetime.now().isoformat()
            }
        ]
        
        return mock_articles
    
    def _get_mock_summary(self, tickers: List[str]) -> List[str]:
        """Generate mock AI summary for demo purposes"""
        import random
        
        summaries = [
            f"• {', '.join(tickers)} stocks show positive momentum with strong institutional buying",
            f"• Market analysts remain bullish on {random.choice(tickers)} with upgraded price targets",
            f"• Technology sector continues to lead market gains, benefiting {', '.join(tickers[:2])} holdings"
        ]
        
        return random.sample(summaries, min(3, len(summaries)))
    
    def _get_fallback_briefing(self, watchlist) -> Dict:
        """Generate fallback briefing when AI service is unavailable"""
        tickers = [stock.ticker for stock in watchlist.stocks]
        
        return {
            "date": datetime.now(),
            "watchlist_name": watchlist.name,
            "summary": [
                f"• Daily briefing for {watchlist.name} watchlist",
                f"• Tracking {len(tickers)} stocks: {', '.join(tickers)}",
                "• AI analysis temporarily unavailable - check back later"
            ],
            "stocks_analyzed": tickers
        }

# Create service instance
ai_service = AIService()
