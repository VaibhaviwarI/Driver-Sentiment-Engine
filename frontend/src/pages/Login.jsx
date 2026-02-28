import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function Login({ setAuthToken }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/admin/login`, { username, password });
            const token = res.data.token;
            localStorage.setItem('adminToken', token);

            // Set default auth header for future axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setAuthToken(token);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow-lg max-w-md mx-auto my-16 border-t-4 border-t-primary">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Login</h2>
            <p className="text-slate-500 mb-8">Please enter your credentials to view the dashboard.</p>

            {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg mb-6 text-sm font-medium">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="form-label">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <button type="submit" className="btn-primary w-full justify-center text-lg mt-2 py-3" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
