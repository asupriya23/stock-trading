from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload  # <-- IMPORTED joinedload
from typing import List  # <-- IMPORTED List
import uvicorn

from database import get_db, engine, Base
from models import User, Watchlist, Stock
from schemas import (  # <-- UPDATED IMPORTS
    UserCreate, 
    UserLogin, 
    WatchlistCreate, 
    WatchlistUpdate, 
    StockCreate,
    Watchlist as WatchlistSchema # <-- IMPORTED Watchlist response schema
)
from auth import create_access_token, verify_token, get_password_hash, verify_password
from services import stock_service, ai_service

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MarketPulse AI API",
    description="A modern stock watchlist application with AI-powered daily briefings",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    token = credentials.credentials
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.get("/")
async def root():
    return {"message": "MarketPulse AI API is running!"}

@app.post("/api/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password using bcrypt_sha256 (handles length internally)
    hashed_password = get_password_hash(user_data.password)
    
    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.get("/api/auth/me")
async def auth_me(current_user: User = Depends(get_current_user)):
    """Return current user info for session bootstrap"""
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name
        }
    }

# ---
# --- THIS IS THE UPDATED FUNCTION ---
# ---
@app.get("/api/watchlists", response_model=List[WatchlistSchema])
async def get_watchlists(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all watchlists for current user"""
    watchlists = db.query(Watchlist)\
        .options(joinedload(Watchlist.stocks))\
        .filter(Watchlist.user_id == current_user.id)\
        .order_by(Watchlist.created_at.desc())\
        .all()
    return watchlists
# ---
# --- END OF UPDATED FUNCTION ---
# ---

@app.post("/api/watchlists", response_model=WatchlistSchema)
async def create_watchlist(watchlist_data: WatchlistCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new watchlist"""
    watchlist = Watchlist(
        name=watchlist_data.name,
        description=watchlist_data.description,
        user_id=current_user.id
    )
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)
    return watchlist

@app.get("/api/watchlists/{watchlist_id}", response_model=WatchlistSchema)
async def get_watchlist(watchlist_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific watchlist with stocks"""
    watchlist = db.query(Watchlist)\
        .options(joinedload(Watchlist.stocks))\
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == current_user.id
        ).first()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    return watchlist

@app.put("/api/watchlists/{watchlist_id}", response_model=WatchlistSchema)
async def update_watchlist(watchlist_id: int, watchlist_data: WatchlistUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a watchlist"""
    watchlist = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    if watchlist_data.name:
        watchlist.name = watchlist_data.name
    if watchlist_data.description:
        watchlist.description = watchlist_data.description
    
    db.commit()
    db.refresh(watchlist)
    return watchlist

@app.delete("/api/watchlists/{watchlist_id}")
async def delete_watchlist(watchlist_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a watchlist"""
    watchlist = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    db.delete(watchlist)
    db.commit()
    return {"message": "Watchlist deleted successfully"}

@app.post("/api/watchlists/{watchlist_id}/stocks")
async def add_stock_to_watchlist(watchlist_id: int, stock_data: StockCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add a stock to a watchlist"""
    # Verify watchlist belongs to user
    watchlist = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    # Check if stock already exists in watchlist
    existing_stock = db.query(Stock).filter(
        Stock.watchlist_id == watchlist_id,
        Stock.ticker == stock_data.ticker.upper()
    ).first()
    
    if existing_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock already in watchlist"
        )
    
    # Create new stock entry
    stock = Stock(
        ticker=stock_data.ticker.upper(),
        company_name=stock_data.company_name,
        watchlist_id=watchlist_id
    )
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock

@app.delete("/api/watchlists/{watchlist_id}/stocks/{stock_id}")
async def remove_stock_from_watchlist(watchlist_id: int, stock_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a stock from a watchlist"""
    # Verify watchlist belongs to user
    watchlist = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    stock = db.query(Stock).filter(
        Stock.id == stock_id,
        Stock.watchlist_id == watchlist_id
    ).first()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found in watchlist"
        )
    
    db.delete(stock)
    db.commit()
    return {"message": "Stock removed from watchlist"}

@app.get("/api/stocks/{ticker}/data")
async def get_stock_data(ticker: str):
    """Get current stock data for a ticker"""
    try:
        stock_data = await stock_service.get_stock_data(ticker.upper())
        return stock_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching stock data: {str(e)}"
        )

@app.get("/api/stocks/{ticker}/chart")
async def get_stock_chart(ticker: str, period: str = "1M"):
    """Get stock chart data for a ticker"""
    try:
        chart_data = await stock_service.get_stock_chart(ticker.upper(), period)
        return chart_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching chart data: {str(e)}"
        )

@app.get("/api/ai-briefing")
async def get_ai_briefing(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get AI daily briefing for user's primary watchlist"""
    # Get user's primary watchlist (first one or most recent)
    primary_watchlist = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).order_by(Watchlist.created_at.desc()).first()
    
    if not primary_watchlist:
        return {"message": "No watchlists found. Create a watchlist to get AI briefings."}
    
    try:
        briefing = await ai_service.generate_daily_briefing(primary_watchlist)
        return briefing
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating AI briefing: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)