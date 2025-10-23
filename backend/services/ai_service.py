import os
import google.generativeai as genai
from typing import List, Dict
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Stock, StockDataPoint
from sqlalchemy import desc, func

load_dotenv()

class AIService:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        # Configure Gemini API
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
        
    async def generate_daily_briefing(self, watchlist) -> Dict:
        """Generate AI daily briefing for a watchlist based on stock data"""
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
            
            # Fetch stock data for analysis
            stock_data = await self._fetch_stock_data_for_analysis(tickers)
            
            # Generate AI summary based on stock data
            summary = await self._generate_ai_summary_from_stock_data(tickers, stock_data)
            
            return {
                "date": datetime.now(),
                "watchlist_name": watchlist.name,
                "summary": summary,
                "stocks_analyzed": tickers
            }
            
        except Exception as e:
            print(f"Error generating AI briefing: {e}")
            # Return fallback briefing if AI service fails
            return self._get_fallback_briefing(watchlist)
    
    async def _fetch_stock_data_for_analysis(self, tickers: List[str]) -> List[Dict]:
        """Fetch stock data for analysis from database"""
        db = SessionLocal()
        try:
            stock_analysis_data = []
            
            for ticker in tickers:
                # Find the stock in database
                stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).first()
                
                if not stock:
                    continue
                
                # Get recent data points (last 30 days)
                recent_data = db.query(StockDataPoint)\
                    .filter(StockDataPoint.stock_id == stock.id)\
                    .order_by(desc(StockDataPoint.date))\
                    .limit(30)\
                    .all()
                
                if not recent_data:
                    continue
                
                # Calculate price movements and trends
                latest_price = recent_data[0].close
                oldest_price = recent_data[-1].close if len(recent_data) > 1 else latest_price
                
                # Calculate daily changes
                daily_changes = []
                for i in range(min(7, len(recent_data) - 1)):  # Last 7 days
                    if i + 1 < len(recent_data):
                        change = ((recent_data[i].close - recent_data[i + 1].close) / recent_data[i + 1].close) * 100
                        daily_changes.append(change)
                
                # Calculate volume trends
                avg_volume = sum(point.volume for point in recent_data) / len(recent_data)
                latest_volume = recent_data[0].volume
                volume_trend = "high" if latest_volume > avg_volume * 1.2 else "low" if latest_volume < avg_volume * 0.8 else "normal"
                
                # Calculate volatility
                if len(daily_changes) > 1:
                    volatility = (sum([(change - sum(daily_changes)/len(daily_changes))**2 for change in daily_changes]) / len(daily_changes))**0.5
                else:
                    volatility = 0
                
                stock_analysis_data.append({
                    "ticker": ticker,
                    "current_price": latest_price,
                    "price_change_30d": ((latest_price - oldest_price) / oldest_price) * 100 if oldest_price > 0 else 0,
                    "daily_changes": daily_changes,
                    "avg_daily_change": sum(daily_changes) / len(daily_changes) if daily_changes else 0,
                    "volume_trend": volume_trend,
                    "volatility": volatility,
                    "data_points_count": len(recent_data)
                })
            
            return stock_analysis_data
            
        except Exception as e:
            print(f"Error fetching stock data: {e}")
            return []
        finally:
            db.close()
    
    async def _generate_ai_summary_from_stock_data(self, tickers: List[str], stock_data: List[Dict]) -> List[str]:
        """Generate AI summary using Gemini API based on stock data analysis"""
        try:
            if not self.model or not stock_data:
                return self._get_mock_summary_from_stock_data(stock_data)
            
            # Prepare stock data content for AI analysis
            stock_analysis_content = "\n".join([
                f"Stock: {data['ticker']} - Current Price: ${data['current_price']:.2f}, "
                f"30-day Change: {data['price_change_30d']:.2f}%, "
                f"Avg Daily Change: {data['avg_daily_change']:.2f}%, "
                f"Volume Trend: {data['volume_trend']}, "
                f"Volatility: {data['volatility']:.2f}%"
                for data in stock_data
            ])
            
            # Create prompt for Gemini to analyze stock data
            prompt = f"""
            Analyze the following stock data for these tickers: {', '.join(tickers)}
            
            Stock Performance Data:
            {stock_analysis_content}
            
            Based on this stock data, provide a concise 4-5 bullet point analysis focusing on:
            - Key price movements and trends
            - Volume patterns and trading activity
            - Volatility and risk assessment
            - Overall market sentiment for these stocks
            - Your own analysis of the stock data
            
            Format as bullet points, each starting with a dash (-). Be specific about the numbers and trends.
            """
            
            # Generate content using Gemini
            response = self.model.generate_content(prompt)
            summary_text = response.text
            
            # Parse bullet points
            summary_lines = [line.strip() for line in summary_text.split('\n') if line.strip()]
            summary = [line for line in summary_lines if line.startswith('-')]
            
            if not summary:
                return self._get_mock_summary_from_stock_data(stock_data)
            
            return summary[:3]  # Limit to 3 bullet points
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._get_mock_summary_from_stock_data(stock_data)
    
    def _get_mock_summary_from_stock_data(self, stock_data: List[Dict]) -> List[str]:
        """Generate mock AI summary based on stock data for demo purposes"""
        import random
        
        if not stock_data:
            return ["• No stock data available for analysis"]
        
        summaries = []
        
        # Analyze the actual stock data to create meaningful mock summaries
        for data in stock_data:
            ticker = data['ticker']
            price_change = data['price_change_30d']
            volatility = data['volatility']
            volume_trend = data['volume_trend']
            
            if price_change > 5:
                summaries.append(f"• {ticker} shows strong upward momentum with {price_change:.1f}% gains over 30 days")
            elif price_change < -5:
                summaries.append(f"• {ticker} experiencing downward pressure with {price_change:.1f}% decline over 30 days")
            else:
                summaries.append(f"• {ticker} trading sideways with {price_change:.1f}% change over 30 days")
            
            if volume_trend == "high":
                summaries.append(f"• {ticker} showing elevated trading volume indicating increased investor interest")
            
            if volatility > 3:
                summaries.append(f"• {ticker} displaying high volatility ({volatility:.1f}%) suggesting market uncertainty")
        
        # If no meaningful data, return generic summaries
        if not summaries:
            summaries = [
                f"• Portfolio analysis based on {len(stock_data)} stocks",
                "• Market data analysis indicates mixed trading patterns",
                "• Continue monitoring for emerging trends and opportunities"
            ]
        
        return summaries[:3]  # Limit to 3 bullet points
    
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
