from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Stock schemas
class StockBase(BaseModel):
    ticker: str
    company_name: str

class StockCreate(StockBase):
    pass

class Stock(BaseModel):
    id: int
    ticker: str
    company_name: Optional[str] = None
    watchlist_id: int
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StockResponse(StockBase):
    id: int
    watchlist_id: int
    added_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Watchlist schemas
class WatchlistBase(BaseModel):
    name: str
    description: Optional[str] = None

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Watchlist(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    user_id: int
    created_at: datetime
    stocks: List[Stock] = []

    model_config = ConfigDict(from_attributes=True)

class WatchlistResponse(WatchlistBase):
    id: int
    user_id: int
    is_primary: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    stocks: List[Stock] = []
    
    model_config = ConfigDict(from_attributes=True)

# Stock data schemas (for API responses)
class StockData(BaseModel):
    ticker: str
    company_name: str
    current_price: float
    change: float
    change_percent: float
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    last_updated: datetime

class ChartData(BaseModel):
    ticker: str
    period: str
    data: List[dict]  # List of {timestamp, price} objects

# AI Briefing schemas
class AIBriefing(BaseModel):
    date: datetime
    watchlist_name: str
    summary: List[str]  # List of bullet points
    stocks_analyzed: List[str]  # List of tickers analyzed

# Price Alert schemas
class PriceAlertBase(BaseModel):
    stock_ticker: str
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    email: str

class PriceAlertCreate(PriceAlertBase):
    pass

class PriceAlertUpdate(BaseModel):
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class PriceAlert(PriceAlertBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    triggered_at: Optional[datetime] = None
    triggered_price: Optional[float] = None
    trigger_type: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
