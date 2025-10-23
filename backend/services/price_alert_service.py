import asyncio
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import SessionLocal
from models import PriceAlert, StockDataPoint
from services.email_service import email_service
from datetime import datetime

class PriceAlertService:
    """Service to check and trigger price alerts based on stock data changes"""
    
    async def check_price_alerts(self, ticker: str, current_price: float):
        """Check if any price alerts should be triggered for a given ticker"""
        db = SessionLocal()
        try:
            # Get all active price alerts for this ticker
            alerts = db.query(PriceAlert).filter(
                PriceAlert.stock_ticker == ticker.upper(),
                PriceAlert.is_active == True,
                PriceAlert.triggered_at.is_(None)  # Only untriggered alerts
            ).all()
            
            if not alerts:
                return
            
            triggered_alerts = []
            
            for alert in alerts:
                should_trigger = False
                trigger_type = None
                
                # Check high price alert
                if alert.high_price and current_price >= alert.high_price:
                    should_trigger = True
                    trigger_type = 'high'
                
                # Check low price alert
                if alert.low_price and current_price <= alert.low_price:
                    should_trigger = True
                    trigger_type = 'low'
                
                if should_trigger:
                    # Mark alert as triggered
                    alert.triggered_at = datetime.now()
                    alert.triggered_price = current_price
                    alert.trigger_type = trigger_type
                    alert.is_active = False  # Deactivate after triggering
                    
                    triggered_alerts.append({
                        'alert': alert,
                        'current_price': current_price,
                        'trigger_type': trigger_type
                    })
            
            if triggered_alerts:
                db.commit()
                
                # Send email notifications for triggered alerts
                for trigger_data in triggered_alerts:
                    await self._send_alert_notification(trigger_data)
                    
                print(f"Triggered {len(triggered_alerts)} price alerts for {ticker}")
            
        except Exception as e:
            print(f"Error checking price alerts for {ticker}: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def _send_alert_notification(self, trigger_data: Dict):
        """Send email notification for triggered alert"""
        try:
            alert = trigger_data['alert']
            
            email_data = {
                'email': alert.email,
                'stock_ticker': alert.stock_ticker,
                'current_price': trigger_data['current_price'],
                'trigger_type': trigger_data['trigger_type'],
                'trigger_price': alert.high_price if trigger_data['trigger_type'] == 'high' else alert.low_price,
                'created_at': alert.created_at
            }
            
            success = await email_service.send_price_alert(email_data)
            if success:
                print(f"Alert notification sent to {alert.email} for {alert.stock_ticker}")
            else:
                print(f"Failed to send alert notification to {alert.email}")
                
        except Exception as e:
            print(f"Error sending alert notification: {e}")
    
    async def get_user_alerts(self, user_id: int) -> List[Dict]:
        """Get all price alerts for a specific user"""
        db = SessionLocal()
        try:
            alerts = db.query(PriceAlert).filter(
                PriceAlert.user_id == user_id
            ).order_by(desc(PriceAlert.created_at)).all()
            
            return [
                {
                    'id': alert.id,
                    'stock_ticker': alert.stock_ticker,
                    'high_price': alert.high_price,
                    'low_price': alert.low_price,
                    'email': alert.email,
                    'is_active': alert.is_active,
                    'created_at': alert.created_at,
                    'triggered_at': alert.triggered_at,
                    'triggered_price': alert.triggered_price,
                    'trigger_type': alert.trigger_type
                }
                for alert in alerts
            ]
        except Exception as e:
            print(f"Error getting user alerts: {e}")
            return []
        finally:
            db.close()
    
    async def check_all_stock_alerts(self):
        """Check price alerts for all stocks with recent data"""
        db = SessionLocal()
        try:
            # Get all stocks with recent data points
            recent_data = db.query(StockDataPoint).filter(
                StockDataPoint.date >= datetime.now().date()
            ).order_by(desc(StockDataPoint.date)).all()
            
            # Group by stock ticker and get latest price for each
            stock_prices = {}
            for data_point in recent_data:
                if data_point.stock.ticker not in stock_prices:
                    stock_prices[data_point.stock.ticker] = data_point.close
            
            # Check alerts for each stock
            for ticker, price in stock_prices.items():
                await self.check_price_alerts(ticker, price)
                
        except Exception as e:
            print(f"Error checking all stock alerts: {e}")
        finally:
            db.close()

# Create service instance
price_alert_service = PriceAlertService()
