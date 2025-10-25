import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { PaperTradingProvider, usePaperTrading } from './contexts/PaperTradingContext';
import StockChart from './components/StockChart';
import { useWatchlist } from './contexts/WatchlistContext';
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

// Protected Route component
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

// Public Route component (redirect to dashboard if logged in)
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
const SimulationBannerWrapper = () => {
  const { isPaperMode, togglePaperMode } = usePaperTrading();
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    setShowBanner(isPaperMode);
  }, [isPaperMode]);

  const handleClose = () => {
    setShowBanner(false);
    togglePaperMode();
  };

  return (
    <SimulationBanner 
      isVisible={showBanner} 
      onClose={handleClose}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <PaperTradingProvider>
          <Router>
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
                  {/* <Route 
                    path="/paper-trading" 
                    element={
                      <ProtectedRoute>
                        <PaperTradingDashboard />
                      </ProtectedRoute>
                    } 
                  /> */}
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