# In backend/models.py
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, 
    Boolean, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # --- ADD THIS RELATIONSHIP ---
    # This connects the User to their Watchlists
    watchlists = relationship("Watchlist", back_populates="owner")

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_primary = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- ADD THIS RELATIONSHIP ---
    # This connects the Watchlist to its Stocks
    stocks = relationship(
        "Stock", 
        back_populates="watchlist", 
        cascade="all, delete-orphan"
    )
    
    # --- ADD THIS RELATIONSHIP ---
    # This connects the Watchlist back to its User
    owner = relationship("User", back_populates="watchlists")

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    company_name = Column(String)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False)
    
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- ADD THIS RELATIONSHIP ---
    # This connects the Stock back to its Watchlist
    watchlist = relationship("Watchlist", back_populates="stocks")

    # --- ADD THIS RELATIONSHIP ---
    # This connects the Stock to its future data points
    data_points = relationship(
        "StockDataPoint", 
        back_populates="stock", 
        cascade="all, delete-orphan"
    )
    
    # Ensure a stock ticker is unique *within* a single watchlist
    __table_args__ = (
        UniqueConstraint('ticker', 'watchlist_id', name='_ticker_watchlist_uc'),
    )

# --- ADD THIS ENTIRE NEW MODEL ---
# This is the table that was missing from your `\dt` command
# and is needed to store your synthetic price data.

class StockDataPoint(Base):
    __tablename__ = "stock_data_points"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    
    date = Column(DateTime, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)

    stock = relationship("Stock", back_populates="data_points")