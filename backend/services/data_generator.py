import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import Stock, StockDataPoint
from services.price_alert_service import price_alert_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockDataGenerator:
    """
    Background service that generates synthetic stock data every 3 seconds.
    Each data point represents 1 day in the database.
    Maintains only 365 data points per stock.
    """
    
    def __init__(self):
        self.running = False
        self.last_prices = {}  # Cache of last prices for each stock
        
    async def start(self):
        """Start the data generator"""
        self.running = True
        logger.info("Stock data generator started")
        await self._generate_loop()
        
    async def stop(self):
        """Stop the data generator"""
        self.running = False
        logger.info("Stock data generator stopped")
        
    async def _generate_loop(self):
        """Main loop that generates data every 3 seconds"""
        while self.running:
            try:
                await self._generate_data_for_all_stocks()
                await asyncio.sleep(3)  # Generate data every 3 seconds
            except Exception as e:
                logger.error(f"Error in data generation loop: {e}")
                await asyncio.sleep(3)
                
    async def _generate_data_for_all_stocks(self):
        """Generate data for all stocks in the database"""
        db = SessionLocal()
        try:
            # Get all stocks
            stocks = db.query(Stock).all()
            
            if not stocks:
                return
            
            for stock in stocks:
                self._generate_data_point(db, stock)
            
            db.commit()
            logger.info(f"Generated data points for {len(stocks)} stocks")
            
            # Check price alerts for all updated stocks
            for stock in stocks:
                if stock.ticker in self.last_prices:
                    await price_alert_service.check_price_alerts(
                        stock.ticker, 
                        self.last_prices[stock.ticker]
                    )
            
        except Exception as e:
            logger.error(f"Error generating data: {e}")
            db.rollback()
        finally:
            db.close()
            
    def _generate_data_point(self, db: Session, stock: Stock):
        """Generate a single data point for a stock"""
        ticker = stock.ticker
        
        # Get the last data point for this stock to determine the next date
        last_point = db.query(StockDataPoint)\
            .filter(StockDataPoint.stock_id == stock.id)\
            .order_by(StockDataPoint.date.desc())\
            .first()
        
        # Determine the base price
        if ticker in self.last_prices:
            base_price = self.last_prices[ticker]
        elif last_point:
            base_price = last_point.close
        else:
            # Initialize with a random price between 50 and 500
            base_price = random.uniform(50, 500)
        
        # Determine the next date (1 day after the last point)
        if last_point:
            next_date = last_point.date + timedelta(days=1)
        else:
            # Start from 365 days ago
            next_date = datetime.now() - timedelta(days=365)
        
        # Generate realistic OHLCV data
        # Daily change between -3% and +3%
        change_percent = random.uniform(-0.03, 0.03)
        close_price = base_price * (1 + change_percent)
        
        # Open price is close to yesterday's close
        open_price = base_price * (1 + random.uniform(-0.005, 0.005))
        
        # High is the maximum of open, close, and some random variation
        high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.01))
        
        # Low is the minimum of open, close, and some random variation
        low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.01))
        
        # Volume is random between 1M and 10M
        volume = random.randint(1_000_000, 10_000_000)
        
        # Create the data point
        data_point = StockDataPoint(
            stock_id=stock.id,
            date=next_date,
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            close=round(close_price, 2),
            volume=volume
        )
        
        db.add(data_point)
        
        # Update the last price cache
        self.last_prices[ticker] = close_price
        
        # Clean up old data points (keep only 365)
        total_points = db.query(func.count(StockDataPoint.id))\
            .filter(StockDataPoint.stock_id == stock.id)\
            .scalar()
        
        if total_points >= 365:
            # Delete the oldest points to keep only 365
            points_to_delete = total_points - 365 + 1  # +1 for the one we just added
            oldest_points = db.query(StockDataPoint)\
                .filter(StockDataPoint.stock_id == stock.id)\
                .order_by(StockDataPoint.date.asc())\
                .limit(points_to_delete)\
                .all()
            
            for point in oldest_points:
                db.delete(point)
                
    async def initialize_stock_data(self, stock_id: int):
        """Initialize historical data for a newly added stock"""
        db = SessionLocal()
        try:
            stock = db.query(Stock).filter(Stock.id == stock_id).first()
            if not stock:
                return
            
            # Check if stock already has data
            existing_count = db.query(func.count(StockDataPoint.id))\
                .filter(StockDataPoint.stock_id == stock_id)\
                .scalar()
            
            if existing_count > 0:
                logger.info(f"Stock {stock.ticker} already has {existing_count} data points")
                return
            
            # Generate 365 days of historical data
            base_price = random.uniform(50, 500)
            current_price = base_price
            start_date = datetime.now() - timedelta(days=365)
            
            logger.info(f"Initializing 365 days of data for {stock.ticker}")
            
            for i in range(365):
                current_date = start_date + timedelta(days=i)
                
                # Generate realistic OHLCV data
                change_percent = random.uniform(-0.03, 0.03)
                close_price = current_price * (1 + change_percent)
                open_price = current_price * (1 + random.uniform(-0.005, 0.005))
                high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.01))
                low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.01))
                volume = random.randint(1_000_000, 10_000_000)
                
                data_point = StockDataPoint(
                    stock_id=stock_id,
                    date=current_date,
                    open=round(open_price, 2),
                    high=round(high_price, 2),
                    low=round(low_price, 2),
                    close=round(close_price, 2),
                    volume=volume
                )
                
                db.add(data_point)
                current_price = close_price
            
            # Update the last price cache
            self.last_prices[stock.ticker] = current_price
            
            db.commit()
            logger.info(f"Initialized 365 data points for {stock.ticker}")
            
        except Exception as e:
            logger.error(f"Error initializing stock data: {e}")
            db.rollback()
        finally:
            db.close()

# Global instance
data_generator = StockDataGenerator()

