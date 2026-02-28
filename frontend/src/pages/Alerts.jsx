import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/alerts`);
            setAlerts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000); // Polling for live alerts
        return () => clearInterval(interval);
    }, []);

    const resolveAlert = async (id) => {
        try {
            await axios.post(`${API_URL}/admin/alerts/${id}/resolve`);
            fetchAlerts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="flex items-center gap-2">
                    <AlertTriangle color="var(--danger)" /> Risk Incident Management
                </h1>
            </div>

            <div className="card">
                <h2>Open Actionable Alerts</h2>
                <div className="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>Driver Name</th>
                                <th>Identified Risk Indicator</th>
                                <th>Incident Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map(a => (
                                <tr key={a.id}>
                                    <td><strong>{a.driver_name}</strong></td>
                                    <td style={{ color: 'var(--danger)' }}>{a.reason}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString()}</td>
                                    <td>
                                        <button onClick={() => resolveAlert(a.id)} className="flex items-center gap-2" style={{ background: 'var(--success)', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                                            <CheckCircle size={16} /> Mark Resolved
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {alerts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem' }}>Zero open alerts. Fleet operation is running smoothly.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
