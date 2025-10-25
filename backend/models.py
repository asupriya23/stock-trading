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

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stock_ticker = Column(String, nullable=False, index=True)
    high_price = Column(Float, nullable=True)
    low_price = Column(Float, nullable=True)
    email = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    triggered_price = Column(Float, nullable=True)
    trigger_type = Column(String, nullable=True)  # 'high' or 'low'

    # Relationship to user
    user = relationship("User")

# Paper Trading Models
class PaperAccount(Base):
    __tablename__ = "paper_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    virtual_cash_balance = Column(Float, default=100000.0)  # Starting with $100,000
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")
    positions = relationship("PaperPosition", back_populates="account", cascade="all, delete-orphan")
    trades = relationship("PaperTrade", back_populates="account", cascade="all, delete-orphan")

class PaperPosition(Base):
    __tablename__ = "paper_positions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("paper_accounts.id"), nullable=False)
    stock_ticker = Column(String, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # Number of shares
    average_buy_price = Column(Float, nullable=False)  # Average price paid per share
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    account = relationship("PaperAccount", back_populates="positions")

    # Ensure unique ticker per account
    __table_args__ = (
        UniqueConstraint('account_id', 'stock_ticker', name='_account_ticker_uc'),
    )

class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("paper_accounts.id"), nullable=False)
    stock_ticker = Column(String, nullable=False, index=True)
    trade_type = Column(String, nullable=False)  # 'buy' or 'sell'
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)  # Price per share
    total_amount = Column(Float, nullable=False)  # quantity * price
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    account = relationship("PaperAccount", back_populates="trades")