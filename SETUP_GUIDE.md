# MarketPulse AI - Complete Setup Guide

## Overview
MarketPulse AI is a modern stock watchlist application with AI-powered daily briefings. The application consists of a React frontend and a FastAPI backend with SQLite/PostgreSQL database support.

## ✅ What's Fixed
- **Backend Database Integration**: Watchlist data is now properly stored in the database instead of browser localStorage
- **Complete API Endpoints**: All CRUD operations for watchlists and stocks are implemented
- **Authentication System**: JWT-based authentication with proper password hashing
- **Stock Data Integration**: Real stock data fetching from financial APIs (with fallback to mock data)
- **AI Briefing Service**: AI-powered daily briefings for watchlists
- **Frontend-Backend Integration**: Frontend now properly communicates with backend APIs

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=sqlite:///./marketpulse.db
   SECRET_KEY=your-secret-key-change-this-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   FINANCIAL_API_KEY=your-financial-api-key-optional
   OPENAI_API_KEY=your-openai-api-key-optional
   NEWS_API_KEY=your-news-api-key-optional
   ```

5. **Run the backend:**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## 🧪 Testing the Integration

Run the test script to verify everything is working:

```bash
python test_backend.py
```

This will test:
- ✅ All imports work correctly
- ✅ Database tables can be created
- ✅ Authentication functions work
- ✅ Services are properly instantiated

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Watchlists
- `GET /api/watchlists` - Get all user watchlists
- `POST /api/watchlists` - Create new watchlist
- `GET /api/watchlists/{id}` - Get specific watchlist
- `PUT /api/watchlists/{id}` - Update watchlist
- `DELETE /api/watchlists/{id}` - Delete watchlist

### Stocks
- `POST /api/watchlists/{id}/stocks` - Add stock to watchlist
- `DELETE /api/watchlists/{id}/stocks/{stock_id}` - Remove stock from watchlist
- `GET /api/stocks/{ticker}/data` - Get stock data
- `GET /api/stocks/{ticker}/chart` - Get stock chart data

### AI Features
- `GET /api/ai-briefing` - Get AI daily briefing

## 🗄️ Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `hashed_password`
- `full_name`
- `is_active`
- `created_at`
- `updated_at`

### Watchlists Table
- `id` (Primary Key)
- `name`
- `description`
- `user_id` (Foreign Key)
- `is_primary`
- `created_at`
- `updated_at`

### Stocks Table
- `id` (Primary Key)
- `ticker`
- `company_name`
- `watchlist_id` (Foreign Key)
- `added_at`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./marketpulse.db` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-here` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `FINANCIAL_API_KEY` | Financial data API key | Optional |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `NEWS_API_KEY` | News API key | Optional |

### Database Options

**SQLite (Default - Development):**
```env
DATABASE_URL=sqlite:///./marketpulse.db
```

**PostgreSQL (Production):**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/marketpulse
```

## 🐳 Docker Support

### Using Docker Compose

1. **Start both services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

## 🔍 Troubleshooting

### Common Issues

1. **Import Errors:**
   - Make sure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version (3.11+ required)

2. **Database Errors:**
   - Ensure database URL is correct in `.env`
   - Check database permissions
   - Try deleting `marketpulse.db` to recreate tables

3. **CORS Errors:**
   - Backend CORS is configured for localhost:3000, 5173, 4173
   - Check that frontend is running on correct port

4. **Authentication Issues:**
   - Check SECRET_KEY in `.env`
   - Verify JWT token format
   - Check token expiration time

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=1
```

## 📈 Features

### ✅ Implemented
- User registration and authentication
- Watchlist CRUD operations
- Stock management within watchlists
- Real-time stock data fetching
- AI-powered daily briefings
- Responsive modern UI
- Database persistence
- API documentation

### 🔮 Future Enhancements
- Real-time price updates via WebSocket
- Advanced charting with technical indicators
- Portfolio performance tracking
- Email notifications
- Mobile app support
- Advanced AI analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `python test_backend.py`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Your MarketPulse AI application is now fully integrated with backend database storage!**
