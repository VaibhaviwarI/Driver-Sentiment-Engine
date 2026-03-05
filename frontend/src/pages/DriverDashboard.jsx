import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { User, Star, MapPin } from 'lucide-react';

// const API_URL = 'http://localhost:3001/api';
// deployment changes: use environment variable for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
                <h1 className="text-3xl font-bold text-slate-900 m-0">Driver View (Dashboard)</h1>
                <div className="card mb-0 flex items-center gap-4 py-3 px-5">
                    <Star className="text-primary" size={24} />
                    <span className="text-slate-700 text-lg">Avg Score: <strong className="text-slate-900">{driver.average_score ? driver.average_score.toFixed(2) : '0.00'}</strong></span>
                </div>
            </div>

            <div className="card mb-8">
                <div className="flex items-center gap-6 mb-4">
                    <div className="bg-slate-100 p-4 rounded-full">
                        <User size={48} className="text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 m-0 mb-1">{driver.name}</h2>
                        <p className="flex items-center gap-2 text-slate-500 m-0">
                            <MapPin size={18} /> Base Region: <span className="font-medium text-slate-700">{driver.region}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Feedback History</h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Assigned Score</th>
                                <th className="p-4 font-semibold text-slate-600">Feedback Text</th>
                                <th className="p-4 font-semibold text-slate-600">Date Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {feedbacks.map(fb => (
                                <tr key={fb.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <span className={`score-badge ${fb.score >= 4 ? 'score-high' : fb.score >= 2.5 ? 'score-mid' : 'score-low'}`}>
                                            {fb.score} / 5
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">{fb.text}</td>
                                    <td className="p-4 text-slate-500 text-sm">{new Date(fb.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {feedbacks.length === 0 && <p className="p-8 text-center text-slate-500">No feedback found on record.</p>}
                </div>
            </div>
        </div>
    );
}
