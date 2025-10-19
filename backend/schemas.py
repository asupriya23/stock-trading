from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
class Stock(BaseModel):
    id: int
    ticker: str
    company_name: Optional[str] = None
    watchlist_id: int
    added_at: int

    model_config = ConfigDict(from_attributes=True) # For Pydantic v2
    # class Config: # For Pydantic v1
    #     orm_mode = True

# 2. Update your Watchlist schema to include a list of stocks
class Watchlist(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    user_id: int
    created_at: int
    stocks: List[Stock] = []  # <--- ADD THIS LINE

    model_config = ConfigDict(from_attributes=True) # For Pydantic v2
    # class Config: # For Pydantic v1
    #     orm_mode = True
class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Watchlist schemas
class WatchlistBase(BaseModel):
    name: str
    description: Optional[str] = None

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WatchlistResponse(WatchlistBase):
    id: int
    user_id: int
    is_primary: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Stock schemas
class StockBase(BaseModel):
    ticker: str
    company_name: str

class StockCreate(StockBase):
    pass

class StockResponse(StockBase):
    id: int
    watchlist_id: int
    added_at: datetime
    
    class Config:
        from_attributes = True

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
    data: list[dict]  # List of {timestamp, price} objects

# AI Briefing schemas
class AIBriefing(BaseModel):
    date: datetime
    watchlist_name: str
    summary: list[str]  # List of bullet points
    stocks_analyzed: list[str]  # List of tickers analyzed
