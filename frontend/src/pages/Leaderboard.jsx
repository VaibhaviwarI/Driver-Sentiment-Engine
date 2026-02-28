import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Medal, Trophy } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const res = await axios.get(`${API_URL}/leaderboard`);
                setLeaders(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLeaders();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="flex items-center gap-2">
                    <Trophy color="gold" size={32} /> Elite Driver Leaderboard
                </h1>
            </div>

            <div className="card" style={{ backgroundImage: 'linear-gradient(to right, #f8f9fc, #ffffff)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    Recognizing drivers with the most exceptional sentiment and safety scores across all operational regions.
                </p>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Global Rank</th>
                                <th>Driver Name</th>
                                <th>Operating Region</th>
                                <th>Sentiment Rating (Avg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.map((d, index) => (
                                <tr key={d.id} style={index < 3 ? { backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.08)' : index === 1 ? 'rgba(192, 192, 192, 0.08)' : 'rgba(205, 127, 50, 0.08)', fontWeight: 'bold' } : {}}>
                                    <td style={{ fontSize: '1.2rem' }}>
                                        {index === 0 ? <Medal color="gold" size={28} /> :
                                            index === 1 ? <Medal color="silver" size={28} /> :
                                                index === 2 ? <Medal color="#cd7f32" size={28} /> :
                                                    <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>#{index + 1}</span>}
                                    </td>
                                    <td>{d.name}</td>
                                    <td><span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }}>{d.region}</span></td>
                                    <td>
                                        <span className={`score-badge score-high`} style={{ fontSize: '1.1rem', padding: '0.4rem 0.8rem' }}>
                                            {d.average_score.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leaders.length === 0 && <p className="mt-4 text-center">Insufficient data to compile the global leaderboard.</p>}
                </div>
            </div>
        </div>
    );
}
