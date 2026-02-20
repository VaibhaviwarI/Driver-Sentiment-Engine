import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, MessageSquare } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function Dashboard() {
    const [drivers, setDrivers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [system, setSystem] = useState({ queueLength: 0, alertThreshold: 2.5 });

    const [newThreshold, setNewThreshold] = useState('');

    const fetchData = async () => {
        try {
            const [drvRes, fbRes, sysRes] = await Promise.all([
                axios.get(`${API_URL}/admin/drivers`),
                axios.get(`${API_URL}/admin/feedbacks`),
                axios.get(`${API_URL}/admin/system`)
            ]);
            setDrivers(drvRes.data);
            setFeedbacks(fbRes.data);
            setSystem(sysRes.data);
        } catch (err) {
            console.error("Dashboard error", err);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 3 seconds to show "Real-time" updates
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateConfig = async (e) => {
        e.preventDefault();
        await axios.post(`${API_URL}/admin/config`, {
            key: 'alert_threshold',
            value: newThreshold
        });
        setNewThreshold('');
        fetchData(); // refresh immediate
    };

    const getBadgeClass = (score) => {
        if (score >= 4) return 'score-high';
        if (score >= 2.5) return 'score-mid';
        return 'score-low';
    };

    const riskyDrivers = drivers.filter(d => d.average_score < parseFloat(system.alertThreshold));

    // Prepare Chart Data
    const chartData = drivers.map(d => ({
        name: d.name.split(' ')[0], // First name for chart
        score: d.average_score
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1>Admin Analytics & Alerts</h1>
                <div className="card flex items-center gap-4" style={{ marginBottom: 0 }}>
                    <span>Queue Backlog: <strong>{system.queueLength}</strong></span>
                    <span style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                        Alert Threshold: <strong>{system.alertThreshold}</strong>
                    </span>
                </div>
            </div>

            {riskyDrivers.length > 0 && (
                <div className="card mb-8" style={{ background: '#fef2f2', borderColor: '#f87171' }}>
                    <h2 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle /> Active Alerts ({riskyDrivers.length})
                    </h2>
                    <p style={{ color: '#991b1b' }}>The following drivers have dropped below the configured threshold of {system.alertThreshold}.</p>
                    <ul style={{ paddingLeft: '20px', color: '#7f1d1d' }}>
                        {riskyDrivers.map(d => (
                            <li key={d.id}><strong>{d.name}</strong> - Avg Rating: {d.average_score} ({d.feedback_count} reviews)</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="stats-grid">
                <div className="card stat-card">
                    <Users size={32} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                    <h3>Total Drivers</h3>
                    <div className="stat-value">{drivers.length}</div>
                </div>
                <div className="card stat-card">
                    <MessageSquare size={32} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                    <h3>Total Feedback Parsed</h3>
                    <div className="stat-value">
                        {drivers.reduce((acc, curr) => acc + curr.feedback_count, 0)}
                    </div>
                </div>
                <div className="card stat-card">
                    <AlertTriangle size={32} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                    <h3>Adjust Threshold</h3>
                    <form onSubmit={handleUpdateConfig} className="flex gap-4 mt-4 justify-center">
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="e.g. 3.0"
                            value={newThreshold}
                            onChange={e => setNewThreshold(e.target.value)}
                            style={{ width: '80px' }}
                            required
                        />
                        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Apply</button>
                    </form>
                </div>
            </div>

            <div className="card mb-8">
                <h2>Driver Average Scores</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis domain={[1, 5]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="score" stroke="var(--primary)" fill="rgba(79, 70, 229, 0.1)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <h2>Live Feedback Stream</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Driver Name</th>
                                <th>Calculated Sentiment Score</th>
                                <th>Raw Feedback</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.map((fb, idx) => (
                                <tr key={idx}>
                                    <td>{fb.driver_name}</td>
                                    <td>
                                        <span className={`score-badge ${getBadgeClass(fb.score)}`}>
                                            {fb.score} / 5
                                        </span>
                                    </td>
                                    <td>{fb.text}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {new Date(fb.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {feedbacks.length === 0 && <p className="mt-4" style={{ textAlign: 'center' }}>No feedback submitted yet.</p>}
                </div>
            </div>

        </div>
    );
}
