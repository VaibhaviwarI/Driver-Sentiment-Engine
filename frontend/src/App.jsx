import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Feedback from './pages/Feedback';
import Dashboard from './pages/Dashboard';
import { Car, BarChart3 } from 'lucide-react';
import './index.css';

function NavLinks() {
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
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <NavLinks />
        <main className="container">
          <Routes>
            <Route path="/" element={<Feedback />} />
            <Route path="/admin" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
