import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Configure axios base URL
import axios from 'axios';
// Use relative base URL so Vite dev proxy forwards to backend and avoids browser CORS
axios.defaults.baseURL = '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
