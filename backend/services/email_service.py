import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASSWORD")
        
    async def send_price_alert(self, alert_data: dict):
        """Send price alert email notification"""
        try:
            if not self.email or not self.password:
                print("Email credentials not configured. Skipping email notification.")
                return False
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = alert_data['email']
            msg['Subject'] = f"🚨 Price Alert: {alert_data['stock_ticker']} - {alert_data['trigger_type'].title()} Threshold Reached"
            
            # Create HTML body
            html_body = self._create_alert_email_body(alert_data)
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)
            
            print(f"Price alert email sent to {alert_data['email']} for {alert_data['stock_ticker']}")
            return True
            
        except Exception as e:
            print(f"Error sending price alert email: {e}")
            return False
    
    def _create_alert_email_body(self, alert_data: dict):
        """Create HTML email body for price alert"""
        stock_ticker = alert_data['stock_ticker']
        current_price = alert_data['current_price']
        trigger_type = alert_data['trigger_type']
        trigger_price = alert_data['trigger_price']
        created_at = alert_data['created_at']
        
        # Format prices
        def format_price(price):
            return f"${price:,.2f}"
        
        # Determine alert message and color
        if trigger_type == 'high':
            alert_message = f"📈 Price went above your high alert threshold!"
            alert_color = "#10B981"  # Green
            trend_icon = "📈"
        else:
            alert_message = f"📉 Price went below your low alert threshold!"
            alert_color = "#EF4444"  # Red
            trend_icon = "📉"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Price Alert - {stock_ticker}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">
                    🚨 Stock Price Alert
                </h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                    {stock_ticker} - {alert_message}
                </p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-top: 0; text-align: center;">
                    {trend_icon} {stock_ticker} Price Alert Triggered
                </h2>
                
                <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Current Price</div>
                        <div style="font-size: 24px; font-weight: bold; color: {alert_color};">{format_price(current_price)}</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Alert Threshold</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1e293b;">{format_price(trigger_price)}</div>
                    </div>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <div style="font-size: 14px; color: #64748b;">Alert Details:</div>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li><strong>Stock:</strong> {stock_ticker}</li>
                        <li><strong>Alert Type:</strong> {trigger_type.title()} Price Alert</li>
                        <li><strong>Triggered At:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                        <li><strong>Alert Created:</strong> {created_at.strftime('%Y-%m-%d %H:%M:%S') if created_at else 'N/A'}</li>
                    </ul>
                </div>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Disclaimer:</strong> This is an automated price alert based on synthetic data. 
                    This should not be considered as financial advice. Always do your own research before making investment decisions.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                    This alert was generated by MarketPulse AI<br>
                    To manage your alerts, visit your dashboard.
                </p>
            </div>
        </body>
        </html>
        """
        
        return html_body
    
    async def send_test_email(self, to_email: str):
        """Send a test email to verify email configuration"""
        try:
            if not self.email or not self.password:
                return False, "Email credentials not configured"
            
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = "MarketPulse AI - Email Configuration Test"
            
            body = """
            <html>
            <body>
                <h2>🎉 Email Configuration Successful!</h2>
                <p>Your email service is working correctly. You will receive price alert notifications at this email address.</p>
                <p>Best regards,<br>MarketPulse AI Team</p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)
            
            return True, "Test email sent successfully"
            
        except Exception as e:
            return False, f"Error sending test email: {str(e)}"

# Create service instance
email_service = EmailService()
