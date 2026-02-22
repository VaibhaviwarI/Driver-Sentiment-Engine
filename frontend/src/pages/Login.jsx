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
        <div className="card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <h2>Admin Login</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Please enter your credentials to view the dashboard.</p>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
