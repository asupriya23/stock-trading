"""
Script to initialize historical data for all existing stocks in the database.
Run this once to populate the database with 365 days of data for each stock.
"""
import asyncio
from database import SessionLocal
from models import Stock
from services.data_generator import data_generator

async def initialize_all_stocks():
    """Initialize data for all existing stocks"""
    db = SessionLocal()
    try:
        # Get all stocks
        stocks = db.query(Stock).all()
        print(f"Found {len(stocks)} stocks in database")
        
        if not stocks:
            print("No stocks found. Add stocks to watchlists first.")
            return
        
        for stock in stocks:
            print(f"Initializing data for {stock.ticker}...")
            await data_generator.initialize_stock_data(stock.id)
            print(f"✓ Completed {stock.ticker}")
        
        print(f"\n✓ Successfully initialized data for all {len(stocks)} stocks")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Stock Data Initialization ===\n")
    asyncio.run(initialize_all_stocks())

