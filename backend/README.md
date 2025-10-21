# MarketPulse AI Backend

FastAPI-based backend for the MarketPulse AI stock watchlist application.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Watchlist Management**: Create, read, update, and delete watchlists
- **Stock Tracking**: Add and remove stocks from watchlists
- **Real-time Stock Data**: Fetch current stock prices and historical data
- **AI Briefings**: Generate daily AI-powered market briefings (optional)

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Production-ready relational database
- **Pydantic**: Data validation using Python type annotations
- **JWT**: Secure token-based authentication
- **Uvicorn**: Lightning-fast ASGI server

## Setup

### Prerequisites

- Python 3.10+ (via conda environment `da331_spark`)
- PostgreSQL 14+
- Conda/Miniconda

### Installation

1. **Activate the conda environment**:
   ```bash
   conda activate da331_spark
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://username@localhost:5432/marketpulse
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   
   # Optional API Keys (will use mock data if not provided)
   FINANCIAL_API_KEY=
   OPENAI_API_KEY=
   NEWS_API_KEY=
   ```

4. **Initialize the database**:
   ```bash
   # Create database
   createdb marketpulse
   
   # Tables will be created automatically on first run
   python main.py
   ```

## Running the Server

### Development Mode

```bash
conda activate da331_spark
python main.py
```

The server will start at `http://localhost:8000`

### API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info

### Watchlists

- `GET /api/watchlists` - Get all watchlists for current user
- `POST /api/watchlists` - Create a new watchlist
- `GET /api/watchlists/{id}` - Get a specific watchlist
- `PUT /api/watchlists/{id}` - Update a watchlist
- `DELETE /api/watchlists/{id}` - Delete a watchlist

### Stocks

- `POST /api/watchlists/{id}/stocks` - Add stock to watchlist
- `DELETE /api/watchlists/{id}/stocks/{stock_id}` - Remove stock from watchlist
- `GET /api/stocks/{ticker}/data` - Get current stock data
- `GET /api/stocks/{ticker}/chart` - Get historical chart data

### AI Features

- `GET /api/ai-briefing` - Get AI-powered daily briefing

## Database Schema

### Users
- `id`: Primary key
- `email`: Unique email address
- `hashed_password`: Bcrypt hashed password
- `full_name`: User's full name
- `created_at`: Timestamp

### Watchlists
- `id`: Primary key
- `name`: Watchlist name
- `description`: Optional description
- `user_id`: Foreign key to users
- `is_primary`: Boolean flag
- `created_at`, `updated_at`: Timestamps

### Stocks
- `id`: Primary key
- `ticker`: Stock ticker symbol
- `company_name`: Company name
- `watchlist_id`: Foreign key to watchlists
- `added_at`: Timestamp

### Stock Data Points
- `id`: Primary key
- `stock_id`: Foreign key to stocks
- `date`: Date of data point
- `open`, `high`, `low`, `close`: OHLC prices
- `volume`: Trading volume

## Development

### Code Structure

```
backend/
├── main.py              # FastAPI application and routes
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic schemas for validation
├── database.py          # Database configuration
├── auth.py              # Authentication utilities
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not in git)
└── services/
    ├── stock_service.py # Stock data fetching
    └── ai_service.py    # AI briefing generation
```

### Adding New Features

1. Define models in `models.py`
2. Create Pydantic schemas in `schemas.py`
3. Add routes in `main.py`
4. Implement business logic in `services/`

## Troubleshooting

### Database Connection Issues

If you get database connection errors:
1. Ensure PostgreSQL is running: `brew services start postgresql@14`
2. Check database exists: `psql -l | grep marketpulse`
3. Verify connection string in `.env`

### Import Errors

If you get import errors, ensure you're in the correct conda environment:
```bash
conda activate da331_spark
```

### Port Already in Use

If port 8000 is already in use:
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

## Production Deployment

For production deployment:

1. Set strong `SECRET_KEY` in environment variables
2. Use a production-grade ASGI server configuration
3. Enable HTTPS/TLS
4. Configure proper CORS origins
5. Set up database backups
6. Use environment-specific configuration
7. Enable logging and monitoring

## License

MIT License - See LICENSE file for details

