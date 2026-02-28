import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { User, Star, MapPin } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function DriverDashboard() {
    const { id } = useParams();
    const [driver, setDriver] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const driverId = id || 1;
                const res = await axios.get(`${API_URL}/driver/dashboard/${driverId}`);
                setDriver(res.data.driver);
                setFeedbacks(res.data.feedbacks);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDriver();
    }, [id]);

    if (!driver) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Driver Info...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1>Driver View (Dashboard)</h1>
                <div className="card flex items-center gap-4" style={{ marginBottom: 0 }}>
                    <Star color="var(--primary)" size={20} />
                    <span>Avg Score: <strong>{driver.average_score ? driver.average_score.toFixed(2) : '0.00'}</strong></span>
                </div>
            </div>

            <div className="card mb-8">
                <div className="flex items-center gap-4" style={{ marginBottom: '1rem' }}>
                    <User size={48} color="var(--text-muted)" />
                    <div>
                        <h2 style={{ marginBottom: '0.2rem' }}>{driver.name}</h2>
                        <p className="flex items-center gap-2" style={{ color: 'var(--text-muted)', margin: 0 }}>
                            <MapPin size={16} /> Base Region: {driver.region}
                        </p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2>Recent Feedback History</h2>
                <div className="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>Assigned Score</th>
                                <th>Feedback Text</th>
                                <th>Date Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.map(fb => (
                                <tr key={fb.id}>
                                    <td>
                                        <span className={`score-badge ${fb.score >= 4 ? 'score-high' : fb.score >= 2.5 ? 'score-mid' : 'score-low'}`}>
                                            {fb.score} / 5
                                        </span>
                                    </td>
                                    <td>{fb.text}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(fb.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {feedbacks.length === 0 && <p className="mt-4" style={{ textAlign: 'center' }}>No feedback found on record.</p>}
                </div>
            </div>
        </div>
    );
}
