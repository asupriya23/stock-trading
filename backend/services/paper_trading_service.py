from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Dict, List, Optional
from datetime import datetime
import logging

from models import PaperAccount, PaperPosition, PaperTrade, User
from schemas import PaperOrderRequest, PaperPortfolioSummary
from services.stock_service import stock_service

logger = logging.getLogger(__name__)

class PaperTradingService:
    def __init__(self):
        self.initial_cash_balance = 100000.0  # Starting with $100,000 virtual funds
    
    async def get_or_create_paper_account(self, user_id: int, db: Session) -> PaperAccount:
        """Get existing paper account or create a new one for the user"""
        paper_account = db.query(PaperAccount).filter(PaperAccount.user_id == user_id).first()
        
        if not paper_account:
            paper_account = PaperAccount(
                user_id=user_id,
                virtual_cash_balance=self.initial_cash_balance
            )
            db.add(paper_account)
            db.commit()
            db.refresh(paper_account)
            logger.info(f"Created new paper account for user {user_id}")
        
        return paper_account
    
    async def get_portfolio_summary(self, user_id: int, db: Session) -> PaperPortfolioSummary:
        """Get comprehensive portfolio summary for paper trading"""
        paper_account = await self.get_or_create_paper_account(user_id, db)
        
        # Get all positions
        positions = db.query(PaperPosition).filter(PaperPosition.account_id == paper_account.id).all()
        
        positions_value = 0.0
        total_pnl = 0.0
        positions_with_pnl = []
        
        for position in positions:
            # Get current market price
            try:
                stock_data = await stock_service.get_stock_data_from_db(position.stock_ticker, db)
                current_price = stock_data.get('current_price', position.average_buy_price)
                
                # Calculate position value and P&L
                position_value = position.quantity * current_price
                cost_basis = position.quantity * position.average_buy_price
                pnl = position_value - cost_basis
                pnl_percent = (pnl / cost_basis) * 100 if cost_basis > 0 else 0
                
                positions_value += position_value
                total_pnl += pnl
                
                # Add P&L info to position
                position_dict = {
                    'id': position.id,
                    'account_id': position.account_id,
                    'stock_ticker': position.stock_ticker,
                    'quantity': position.quantity,
                    'average_buy_price': position.average_buy_price,
                    'current_price': current_price,
                    'position_value': position_value,
                    'pnl': pnl,
                    'pnl_percent': pnl_percent,
                    'created_at': position.created_at,
                    'updated_at': position.updated_at
                }
                positions_with_pnl.append(position_dict)
                
            except Exception as e:
                logger.error(f"Error getting stock data for {position.stock_ticker}: {e}")
                # Use average buy price as fallback
                position_value = position.quantity * position.average_buy_price
                positions_value += position_value
        
        total_value = paper_account.virtual_cash_balance + positions_value
        total_pnl_percent = (total_pnl / (total_value - total_pnl)) * 100 if (total_value - total_pnl) > 0 else 0
        
        return PaperPortfolioSummary(
            total_value=round(total_value, 2),
            cash_balance=round(paper_account.virtual_cash_balance, 2),
            positions_value=round(positions_value, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percent=round(total_pnl_percent, 2),
            positions=positions_with_pnl
        )
    
    async def execute_buy_order(self, user_id: int, order: PaperOrderRequest, db: Session) -> Dict:
        """Execute a buy order for paper trading"""
        paper_account = await self.get_or_create_paper_account(user_id, db)
        
        # Get current market price
        try:
            stock_data = await stock_service.get_stock_data_from_db(order.stock_ticker, db)
            current_price = stock_data.get('current_price')
            
            if not current_price:
                raise ValueError(f"Could not get current price for {order.stock_ticker}")
            
            # Use limit price if specified and it's better than market price
            if order.order_type == "limit" and order.limit_price:
                if order.limit_price < current_price:
                    # Limit order not filled (price too low)
                    return {
                        "success": False,
                        "message": f"Limit order not filled. Current price ${current_price:.2f} is higher than limit price ${order.limit_price:.2f}",
                        "order_type": "limit",
                        "limit_price": order.limit_price,
                        "current_price": current_price
                    }
                current_price = order.limit_price
            
        except Exception as e:
            logger.error(f"Error getting stock price for {order.stock_ticker}: {e}")
            return {
                "success": False,
                "message": f"Could not get current price for {order.stock_ticker}",
                "error": str(e)
            }
        
        # Calculate total cost
        total_cost = order.quantity * current_price
        
        # Check if user has enough cash
        if paper_account.virtual_cash_balance < total_cost:
            return {
                "success": False,
                "message": f"Insufficient funds. Required: ${total_cost:.2f}, Available: ${paper_account.virtual_cash_balance:.2f}",
                "required_amount": total_cost,
                "available_amount": paper_account.virtual_cash_balance
            }
        
        # Execute the trade
        try:
            # Update cash balance
            paper_account.virtual_cash_balance -= total_cost
            
            # Check if user already has a position in this stock
            existing_position = db.query(PaperPosition).filter(
                and_(
                    PaperPosition.account_id == paper_account.id,
                    PaperPosition.stock_ticker == order.stock_ticker.upper()
                )
            ).first()
            
            if existing_position:
                # Update existing position (average price calculation)
                total_shares = existing_position.quantity + order.quantity
                total_cost_basis = (existing_position.quantity * existing_position.average_buy_price) + total_cost
                new_average_price = total_cost_basis / total_shares
                
                existing_position.quantity = total_shares
                existing_position.average_buy_price = new_average_price
            else:
                # Create new position
                new_position = PaperPosition(
                    account_id=paper_account.id,
                    stock_ticker=order.stock_ticker.upper(),
                    quantity=order.quantity,
                    average_buy_price=current_price
                )
                db.add(new_position)
            
            # Record the trade
            trade = PaperTrade(
                account_id=paper_account.id,
                stock_ticker=order.stock_ticker.upper(),
                trade_type="buy",
                quantity=order.quantity,
                price=current_price,
                total_amount=total_cost
            )
            db.add(trade)
            
            db.commit()
            
            logger.info(f"Executed buy order: {order.quantity} shares of {order.stock_ticker} at ${current_price:.2f}")
            
            return {
                "success": True,
                "message": f"Successfully bought {order.quantity} shares of {order.stock_ticker} at ${current_price:.2f}",
                "trade": {
                    "stock_ticker": order.stock_ticker.upper(),
                    "quantity": order.quantity,
                    "price": current_price,
                    "total_amount": total_cost,
                    "trade_type": "buy"
                },
                "remaining_cash": paper_account.virtual_cash_balance
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error executing buy order: {e}")
            return {
                "success": False,
                "message": "Error executing buy order",
                "error": str(e)
            }
    
    async def execute_sell_order(self, user_id: int, order: PaperOrderRequest, db: Session) -> Dict:
        """Execute a sell order for paper trading"""
        paper_account = await self.get_or_create_paper_account(user_id, db)
        
        # Check if user has the position
        position = db.query(PaperPosition).filter(
            and_(
                PaperPosition.account_id == paper_account.id,
                PaperPosition.stock_ticker == order.stock_ticker.upper()
            )
        ).first()
        
        if not position:
            return {
                "success": False,
                "message": f"You don't have any shares of {order.stock_ticker} to sell"
            }
        
        if position.quantity < order.quantity:
            return {
                "success": False,
                "message": f"Insufficient shares. You have {position.quantity} shares, trying to sell {order.quantity}"
            }
        
        # Get current market price
        try:
            stock_data = await stock_service.get_stock_data_from_db(order.stock_ticker, db)
            current_price = stock_data.get('current_price')
            
            if not current_price:
                raise ValueError(f"Could not get current price for {order.stock_ticker}")
            
            # Use limit price if specified and it's better than market price
            if order.order_type == "limit" and order.limit_price:
                if order.limit_price > current_price:
                    # Limit order not filled (price too high)
                    return {
                        "success": False,
                        "message": f"Limit order not filled. Current price ${current_price:.2f} is lower than limit price ${order.limit_price:.2f}",
                        "order_type": "limit",
                        "limit_price": order.limit_price,
                        "current_price": current_price
                    }
                current_price = order.limit_price
            
        except Exception as e:
            logger.error(f"Error getting stock price for {order.stock_ticker}: {e}")
            return {
                "success": False,
                "message": f"Could not get current price for {order.stock_ticker}",
                "error": str(e)
            }
        
        # Calculate total proceeds
        total_proceeds = order.quantity * current_price
        
        try:
            # Update cash balance
            paper_account.virtual_cash_balance += total_proceeds
            
            # Update position
            if position.quantity == order.quantity:
                # Selling all shares, delete the position
                db.delete(position)
            else:
                # Partial sale, update quantity
                position.quantity -= order.quantity
            
            # Record the trade
            trade = PaperTrade(
                account_id=paper_account.id,
                stock_ticker=order.stock_ticker.upper(),
                trade_type="sell",
                quantity=order.quantity,
                price=current_price,
                total_amount=total_proceeds
            )
            db.add(trade)
            
            db.commit()
            
            logger.info(f"Executed sell order: {order.quantity} shares of {order.stock_ticker} at ${current_price:.2f}")
            
            return {
                "success": True,
                "message": f"Successfully sold {order.quantity} shares of {order.stock_ticker} at ${current_price:.2f}",
                "trade": {
                    "stock_ticker": order.stock_ticker.upper(),
                    "quantity": order.quantity,
                    "price": current_price,
                    "total_amount": total_proceeds,
                    "trade_type": "sell"
                },
                "remaining_cash": paper_account.virtual_cash_balance
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error executing sell order: {e}")
            return {
                "success": False,
                "message": "Error executing sell order",
                "error": str(e)
            }
    
    async def get_trade_history(self, user_id: int, db: Session, limit: int = 50) -> List[PaperTrade]:
        """Get trade history for paper trading account"""
        paper_account = await self.get_or_create_paper_account(user_id, db)
        
        trades = db.query(PaperTrade).filter(
            PaperTrade.account_id == paper_account.id
        ).order_by(PaperTrade.created_at.desc()).limit(limit).all()
        
        return trades
    
    async def reset_paper_account(self, user_id: int, db: Session) -> Dict:
        """Reset paper account to initial state"""
        paper_account = await self.get_or_create_paper_account(user_id, db)
        
        try:
            # Delete all positions
            db.query(PaperPosition).filter(PaperPosition.account_id == paper_account.id).delete()
            
            # Delete all trades
            db.query(PaperTrade).filter(PaperTrade.account_id == paper_account.id).delete()
            
            # Reset cash balance
            paper_account.virtual_cash_balance = self.initial_cash_balance
            
            db.commit()
            
            logger.info(f"Reset paper account for user {user_id}")
            
            return {
                "success": True,
                "message": "Paper account reset successfully",
                "new_cash_balance": self.initial_cash_balance
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error resetting paper account: {e}")
            return {
                "success": False,
                "message": "Error resetting paper account",
                "error": str(e)
            }

# Create service instance
paper_trading_service = PaperTradingService()
