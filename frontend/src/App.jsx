import React from 'react';
// Import useLocation and useNavigate from react-router-dom
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
// usePaperTrading is no longer needed here, but PaperTradingProvider is
import { PaperTradingProvider } from './contexts/PaperTradingContext';
// import StockChart from './components/StockChart'; // Unused import
// import { useWatchlist } from './contexts/WatchlistContext'; // Duplicate/Unused import
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WatchlistDetail from './pages/WatchlistDetail';
import StockDetail from './pages/StockDetail';
import SimulationBanner from './components/SimulationBanner';
//import PaperTradingDashboard from './pages/PaperTradingDashboard';
import SimulationDashboard from './pages/SimulationDashboard'; // Renamed
import './App.css';

// Protected Route component (No changes needed)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route component (No changes needed)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

// Simulation Banner Wrapper
// UPDATED to use URL state instead of React state
const SimulationBannerWrapper = () => {
  // const { isPaperMode, togglePaperMode } = usePaperTrading(); // REMOVED
  // const [showBanner, setShowBanner] = React.useState(false); // REMOVED
  
  // ADDED hooks to read URL and navigate
  const location = useLocation();
  const navigate = useNavigate();

  // React.useEffect(() => { // REMOVED
  //   setShowBanner(isPaperMode);
  // }, [isPaperMode]);

  // UPDATED: Banner is visible if the URL path is /simulation
  const isVisible = location.pathname === '/simulation';

  const handleClose = () => {
    // setShowBanner(false); // REMOVED
    // togglePaperMode(); // REMOVED
    
    // UPDATED: "Closing" the banner now navigates back to the dashboard
    navigate('/dashboard');
  };

  return (
    <SimulationBanner 
      isVisible={isVisible} // UPDATED
      onClose={handleClose}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <PaperTradingProvider>
          <Router> {/* Router is here, so SimulationBannerWrapper and Navbar can use hooks */}
            <div className="min-h-screen">
              <SimulationBannerWrapper />
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Old route is commented out, which is correct */}
                  <Route path="/simulation" element={<ProtectedRoute><SimulationDashboard /></ProtectedRoute>} />

                  <Route 
                    path="/watchlist/:id" 
                    element={
                      <ProtectedRoute>
                        <WatchlistDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/stock/:ticker" 
                    element={
                      <ProtectedRoute>
                        <StockDetail />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </main>
            </div>
          </Router>
        </PaperTradingProvider>
      </WatchlistProvider>
    </AuthProvider>
  );
}

export default App;