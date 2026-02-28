import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Feedback from './pages/Feedback';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DriverDashboard from './pages/DriverDashboard';
import Alerts from './pages/Alerts';
import Fleet from './pages/Fleet';
import Leaderboard from './pages/Leaderboard';
import AuditLogs from './pages/AuditLogs';
import { Car, BarChart3, LogOut, AlertTriangle, Map, Trophy, User, ShieldCheck } from 'lucide-react';
import './index.css';

function NavLinks({ authToken, handleLogout }) {
  const location = useLocation();
  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b-4 border-primary py-4 mb-8 shadow-md">
      <div className="max-w-5xl mx-auto px-8 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Car size={32} className="text-primary" />
          <h2 className="text-white m-0 text-xl font-bold tracking-tight">Driver Sentiment Engine</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/" className={`px-3 py-2 rounded-md font-medium transition-colors ${location.pathname === '/' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
            Rider App
          </Link>
          <Link to="/leaderboard" className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${location.pathname === '/leaderboard' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
            <Trophy size={18} /> Elite Rank
          </Link>
          <Link to="/admin" className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${location.pathname === '/admin' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
            <BarChart3 size={18} /> Admin
          </Link>
          {authToken && (
            <>
              <Link to="/fleet" className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${location.pathname === '/fleet' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                <Map size={18} /> Fleet
              </Link>
              <Link to="/alerts" className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${location.pathname === '/alerts' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                <AlertTriangle size={18} /> Alerts
              </Link>
              <Link to="/audit-logs" className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${location.pathname === '/audit-logs' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                <ShieldCheck size={18} /> Audit Trail
              </Link>
              <Link to="/driver/1" className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${location.pathname.startsWith('/driver') ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                <User size={18} /> Profile
              </Link>
              <button onClick={handleLogout} className="btn-outline border-white/20 text-white hover:bg-white/10 hover:text-white ml-2 py-1.5 px-3">
                <LogOut size={16} /> Logout
              </button>
            </>
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
      <div className="min-h-screen flex flex-col">
        <NavLinks authToken={authToken} handleLogout={handleLogout} />
        <main className="max-w-5xl mx-auto px-8 w-full pb-12 flex-1">
          <Routes>
            <Route path="/" element={<Feedback />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/driver/:id" element={<DriverDashboard />} />
            <Route
              path="/admin"
              element={authToken ? <Dashboard /> : <Login setAuthToken={setAuthToken} />}
            />
            <Route
              path="/alerts"
              element={authToken ? <Alerts /> : <Login setAuthToken={setAuthToken} />}
            />
            <Route
              path="/fleet"
              element={authToken ? <Fleet /> : <Login setAuthToken={setAuthToken} />}
            />
            <Route
              path="/audit-logs"
              element={authToken ? <AuditLogs /> : <Login setAuthToken={setAuthToken} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
