import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Feedback from './pages/Feedback';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Car, BarChart3, LogOut } from 'lucide-react';
import './index.css';

function NavLinks({ authToken, handleLogout }) {
  const location = useLocation();
  return (
    <nav>
      <div className="nav-content">
        <div className="flex items-center gap-4">
          <Car size={32} color="var(--primary)" />
          <h2>MoveInSync Sentiment Engine</h2>
        </div>
        <div className="nav-links flex items-center">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Rider App
          </Link>
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} />
              Admin Dashboard
            </div>
          </Link>
          {authToken && (
            <button onClick={handleLogout} className="flex items-center gap-2 outline-btn ml-4" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('adminToken') || null);

  useEffect(() => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authToken]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAuthToken(null);
  };

  return (
    <Router>
      <div className="app-wrapper">
        <NavLinks authToken={authToken} handleLogout={handleLogout} />
        <main className="container">
          <Routes>
            <Route path="/" element={<Feedback />} />
            <Route
              path="/admin"
              element={authToken ? <Dashboard /> : <Login setAuthToken={setAuthToken} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
