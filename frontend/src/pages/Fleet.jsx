import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Map, Users, TrendingUp } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function Fleet() {
    const [region, setRegion] = useState('North');
    const [drivers, setDrivers] = useState([]);
    const [riskStats, setRiskStats] = useState({ high: 0, medium: 0, low: 0 });

    useEffect(() => {
        const fetchFleet = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/fleet/region/${region}`);
                setDrivers(res.data);

                // Fetch risk classification overall just to display alongside
                const riskRes = await axios.get(`${API_URL}/admin/drivers/risk`);
                setRiskStats({
                    high: riskRes.data.high.length,
                    medium: riskRes.data.medium.length,
                    low: riskRes.data.low.length
                });

            } catch (err) {
                console.error(err);
            }
        };
        fetchFleet();
    }, [region]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="flex items-center gap-2">
                    <Map color="var(--primary)" /> Fleet Operations by Region
                </h1>
                <div className="card flex items-center gap-4" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 'bold', margin: 0 }}>Active Region View:</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '1rem' }}>
                        <option value="North">North Region</option>
                        <option value="South">South Region</option>
                        <option value="East">East Region</option>
                        <option value="West">West Region</option>
                    </select>
                </div>
            </div>

            <div className="stats-grid mb-8">
                <div className="card stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                    <h3 style={{ color: 'var(--success)' }}>Low Risk Drivers</h3>
                    <div className="stat-value">{riskStats.low}</div>
                    <p style={{ color: 'var(--text-muted)' }}>Score &gt; 3.5</p>
                </div>
                <div className="card stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                    <h3 style={{ color: 'var(--warning)' }}>Medium Risk Drivers</h3>
                    <div className="stat-value">{riskStats.medium}</div>
                    <p style={{ color: 'var(--text-muted)' }}>Score 2.5 - 3.5</p>
                </div>
                <div className="card stat-card" style={{ borderTop: '4px solid var(--danger)' }}>
                    <h3 style={{ color: 'var(--danger)' }}>High Risk Drivers</h3>
                    <div className="stat-value">{riskStats.high}</div>
                    <p style={{ color: 'var(--text-muted)' }}>Score &lt; 2.5</p>
                </div>
            </div>

            <div className="card">
                <h2><Users size={20} className="inline mr-2" /> Allocated Drivers - {region}</h2>
                <div className="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>Driver ID</th>
                                <th>Driver Name</th>
                                <th>Sentiment / Safety Score</th>
                                <th>Total Commutes Tracked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map(d => (
                                <tr key={d.id}>
                                    <td><strong>#{d.id}</strong></td>
                                    <td>{d.name}</td>
                                    <td>
                                        <span className={`score-badge ${d.average_score >= 4 ? 'score-high' : d.average_score >= 2.5 ? 'score-mid' : 'score-low'}`}>
                                            {d.average_score > 0 ? d.average_score.toFixed(2) : 'No Data'}
                                        </span>
                                    </td>
                                    <td>{d.feedback_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {drivers.length === 0 && <p className="mt-4 text-center">No active drivers found for this territory.</p>}
                </div>
            </div>
        </div>
    );
}
