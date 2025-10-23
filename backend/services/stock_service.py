import requests
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import desc

load_dotenv()

class StockService:
    def __init__(self):
        self.api_key = os.getenv("FINANCIAL_API_KEY")
        self.base_url = "https://api.polygon.io/v2"
        
    async def get_stock_data(self, ticker: str) -> Dict:
        """Get current stock data for a ticker"""
        try:
            # Using Polygon.io API (free tier available)
            url = f"{self.base_url}/aggs/ticker/{ticker}/prev"
            params = {
                "apikey": self.api_key,
                "adjusted": "true"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK" or not data.get("results"):
                # Fallback to a mock response for demo purposes
                return self._get_mock_stock_data(ticker)
            
            result = data["results"][0]
            
            return {
                "ticker": ticker,
                "company_name": self._get_company_name(ticker),
                "current_price": result["c"],  # Close price
                "change": result["c"] - result["o"],  # Close - Open
                "change_percent": ((result["c"] - result["o"]) / result["o"]) * 100,
                "volume": result["v"],
                "last_updated": datetime.now()
            }
            
        except Exception as e:
            # Return mock data if API fails
            return self._get_mock_stock_data(ticker)
    
    async def get_stock_chart(self, ticker: str, period: str = "1M", db: Session = None) -> Dict:
        """Get stock chart data for a ticker from database"""
        if db is None:
            # Fallback to mock data if no database session provided
            return self._get_mock_chart_data(ticker, period)
        
        try:
            from models import Stock, StockDataPoint
            
            # Find the stock in database
            stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).first()
            
            if not stock:
                # Stock not found in database, return mock data
                return self._get_mock_chart_data(ticker, period)
            
            # Map period to days
            period_days = {
                "1W": 7,
                "1M": 30,
                "3M": 90,
                "1Y": 365
            }
            
            days = period_days.get(period, 30)
            
            # Get the last N data points
            data_points = db.query(StockDataPoint)\
                .filter(StockDataPoint.stock_id == stock.id)\
                .order_by(desc(StockDataPoint.date))\
                .limit(days)\
                .all()
            
            if not data_points:
                # No data points found, return mock data
                return self._get_mock_chart_data(ticker, period)
            
            # Reverse to get chronological order (oldest to newest)
            data_points.reverse()
            
            # Format data for chart
            chart_data = []
            for point in data_points:
                chart_data.append({
                    "timestamp": int(point.date.timestamp() * 1000),  # Convert to milliseconds
                    "price": point.close,
                    "volume": point.volume,
                    "open": point.open,
                    "high": point.high,
                    "low": point.low
                })
            
            return {
                "ticker": ticker,
                "period": period,
                "data": chart_data
            }
            
        except Exception as e:
            print(f"Error fetching chart data from database: {e}")
            return self._get_mock_chart_data(ticker, period)
    
    async def get_stock_data_from_db(self, ticker: str, db: Session) -> Dict:
        """Get current stock data from database"""
        try:
            from models import Stock, StockDataPoint
            
            # Find the stock in database
            stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).first()
            
            if not stock:
                return self._get_mock_stock_data(ticker)
            
            # Get the latest data point
            latest_point = db.query(StockDataPoint)\
                .filter(StockDataPoint.stock_id == stock.id)\
                .order_by(desc(StockDataPoint.date))\
                .first()
            
            if not latest_point:
                return self._get_mock_stock_data(ticker)
            
            # Get the previous data point for change calculation
            previous_point = db.query(StockDataPoint)\
                .filter(StockDataPoint.stock_id == stock.id)\
                .order_by(desc(StockDataPoint.date))\
                .offset(1)\
                .first()
            
            if previous_point:
                change = latest_point.close - previous_point.close
                change_percent = (change / previous_point.close) * 100
            else:
                change = 0
                change_percent = 0
            
            return {
                "ticker": ticker.upper(),
                "company_name": self._get_company_name(ticker),
                "current_price": round(latest_point.close, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "volume": latest_point.volume,
                "last_updated": latest_point.date
            }
            
        except Exception as e:
            print(f"Error fetching stock data from database: {e}")
            return self._get_mock_stock_data(ticker)
    
    def _get_mock_stock_data(self, ticker: str) -> Dict:
        """Generate mock stock data for demo purposes"""
        import random
        
        base_price = random.uniform(50, 500)
        change = random.uniform(-10, 10)
        change_percent = (change / base_price) * 100
        
        return {
            "ticker": ticker,
            "company_name": self._get_company_name(ticker),
            "current_price": round(base_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "volume": random.randint(1000000, 10000000),
            "last_updated": datetime.now()
        }
    
    def _get_mock_chart_data(self, ticker: str, period: str) -> Dict:
        """Generate mock chart data for demo purposes"""
        import random
        from datetime import datetime, timedelta
        
        days = {"1W": 7, "1M": 30, "3M": 90, "1Y": 365}.get(period, 30)
        base_price = random.uniform(50, 500)
        
        chart_data = []
        current_date = datetime.now() - timedelta(days=days)
        
        for i in range(days):
            price_change = random.uniform(-0.05, 0.05)  # ±5% daily change
            base_price *= (1 + price_change)
            
            chart_data.append({
                "timestamp": int(current_date.timestamp()),
                "price": round(base_price, 2),
                "volume": random.randint(100000, 1000000)
            })
            current_date += timedelta(days=1)
        
        return {
            "ticker": ticker,
            "period": period,
            "data": chart_data
        }
    
    def _get_company_name(self, ticker: str) -> str:
        """Get company name for ticker (mock implementation)"""
        company_names = {
            "AAPL": "Apple Inc.",
            "GOOGL": "Alphabet Inc.",
            "MSFT": "Microsoft Corporation",
            "AMZN": "Amazon.com Inc.",
            "TSLA": "Tesla Inc.",
            "META": "Meta Platforms Inc.",
            "NVDA": "NVIDIA Corporation",
            "NFLX": "Netflix Inc.",
            "AMD": "Advanced Micro Devices Inc.",
            "INTC": "Intel Corporation"
        }
        return company_names.get(ticker, f"{ticker} Corporation")

# Create service instance
stock_service = StockService()
