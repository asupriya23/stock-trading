# MarketPulse AI

A modern stock watchlist application with AI-powered daily briefings.

## ✅ Recent Updates - Backend Fixed & PostgreSQL Integrated!

**🎉 Backend has been completely fixed and integrated with PostgreSQL!**

### What's Fixed:
- ✅ **Backend Errors Fixed**: All typos and schema issues resolved
- ✅ **PostgreSQL Integration**: Production-ready database setup
- ✅ **Complete Backend Integration**: All watchlist operations use the database
- ✅ **Real Stock Data**: Fetches actual stock prices from financial APIs
- ✅ **Persistent Storage**: Your watchlists survive browser refreshes and device changes
- ✅ **User Authentication**: Secure JWT-based login system
- ✅ **API Documentation**: Full REST API with interactive docs at `/docs`
- ✅ **Conda Environment**: Uses da331_spark conda environment for Python dependencies

## Features

- **User Authentication**: Secure sign-up and login with JWT tokens
- **Watchlist Management**: Create, read, update, and delete multiple named watchlists
- **Stock Data Display**: Real-time stock prices, company names, and daily changes
- **Interactive Charts**: Price history visualization for individual stocks
- **AI Daily Briefing**: Automated daily news summaries for your watchlist stocks
- **Database Persistence**: All data stored securely in the backend database

## Tech Stack

### Backend
- **Python 3.10+** with **FastAPI** framework
- **PostgreSQL 14** database with **SQLAlchemy** ORM
- **JWT** authentication with bcrypt password hashing
- **Pydantic** for data validation
- **Real-time stock data** from financial APIs (with mock data fallback)
- **Conda environment**: da331_spark

### Frontend
- **React** with **Vite** build tool
- **JavaScript** for modern web development
- **Chart.js** for interactive stock charts
- **Tailwind CSS** for styling

## 🚀 Quick Start

### Option 1: Using the Startup Script (Recommended)
```bash
# Make the script executable and run it
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup (5 minutes)

**Prerequisites:**
- PostgreSQL 14+ installed and running
- Conda with da331_spark environment

**Backend:**
```bash
cd backend

# Activate conda environment
conda activate da331_spark

# Install dependencies
pip install -r requirements.txt

# Create .env file (already created if you used start.sh)
# Edit .env to configure your database connection

# Start the server
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

🎉 **That's it!** Your app will be running at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 3: Using Docker Compose
```bash
# Start all services with Docker
docker-compose up --build
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://username@localhost:5432/marketpulse

# Security
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional API Keys (app works without these using mock data)
FINANCIAL_API_KEY=your-financial-api-key-optional
OPENAI_API_KEY=your-openai-api-key-optional
NEWS_API_KEY=your-news-api-key-optional
```

**Note**: The `.env` file is automatically created when you run `./start.sh`. Replace `username` with your PostgreSQL username (usually your system username on macOS).

### API Keys (Optional)
- **Financial API**: Get a free API key from [Polygon.io](https://polygon.io/) for real stock data
- **OpenAI API**: Get an API key from [OpenAI](https://openai.com/) for AI briefings
- **News API**: Get a free API key from [NewsAPI](https://newsapi.org/) for news aggregation

## API Documentation
Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Project Structure
```
marketpulse-ai/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication logic
│   ├── database.py         # Database configuration
│   ├── services/           # Business logic services
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── App.jsx         # Main app component
│   └── package.json        # Node dependencies
├── docker-compose.yml      # Docker configuration
├── start.sh               # Startup script
└── README.md              # This file
```

## Features Overview

### 1. User Authentication
- Secure JWT-based authentication
- User registration and login
- Protected routes and API endpoints

### 2. Watchlist Management
- Create multiple named watchlists
- Add/remove stocks from watchlists
- View watchlist details with stock information

### 3. Stock Data & Charts
- Real-time stock price data
- Interactive price history charts
- Multiple time periods (1D, 1W, 1M, 3M, 1Y)

### 4. AI Daily Briefing
- Automated news aggregation for watchlist stocks
- AI-powered summarization using OpenAI
- Daily insights and market analysis

## Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
cd backend
alembic upgrade head
```

## Deployment

### Production Setup
1. Set up a PostgreSQL database
2. Configure environment variables
3. Deploy backend to a cloud service (Heroku, AWS, etc.)
4. Deploy frontend to a CDN (Vercel, Netlify, etc.)

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
MIT License - see LICENSE file for details
