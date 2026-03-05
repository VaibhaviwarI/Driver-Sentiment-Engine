import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, MessageSquare } from 'lucide-react';

// const API_URL = 'http://localhost:3001/api';
// deployment changes: use environment variable for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
                <h1 className="text-3xl font-bold text-slate-900 mb-0">Admin Analytics & Alerts</h1>
                <div className="card mb-0 flex items-center gap-4 py-3 px-5">
                    <span className="text-slate-700">Queue Backlog: <strong className="text-slate-900">{system.queueLength}</strong></span>
                    <span className="border-l border-slate-200 pl-4 text-slate-700">
                        Alert Threshold: <strong className="text-slate-900">{system.alertThreshold}</strong>
                    </span>
                </div>
            </div>

            {riskyDrivers.length > 0 && (
                <div className="card mb-8 bg-red-50 border-red-200">
                    <h2 className="text-red-700 flex items-center gap-2 m-0 mb-2">
                        <AlertTriangle className="text-red-700" /> Active Alerts ({riskyDrivers.length})
                    </h2>
                    <p className="text-red-800 mb-4">The following drivers have dropped below the configured threshold of {system.alertThreshold}.</p>
                    <ul className="pl-6 text-red-900 list-disc space-y-1">
                        {riskyDrivers.map(d => (
                            <li key={d.id}><strong>{d.name}</strong> - Avg Rating: {d.average_score} ({d.feedback_count} reviews)</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card text-center flex flex-col items-center justify-center">
                    <Users size={32} className="text-primary mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">Total Drivers</h3>
                    <div className="text-4xl font-bold text-primary mt-2">{drivers.length}</div>
                </div>
                <div className="card text-center flex flex-col items-center justify-center">
                    <MessageSquare size={32} className="text-emerald-500 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">Total Feedback Parsed</h3>
                    <div className="text-4xl font-bold text-emerald-500 mt-2">
                        {drivers.reduce((acc, curr) => acc + curr.feedback_count, 0)}
                    </div>
                </div>
                <div className="card text-center flex flex-col items-center justify-center">
                    <AlertTriangle size={32} className="text-rose-500 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">Adjust Threshold</h3>
                    <form onSubmit={handleUpdateConfig} className="flex gap-3 mt-4 justify-center w-full">
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="e.g. 3.0"
                            value={newThreshold}
                            onChange={e => setNewThreshold(e.target.value)}
                            className="form-input w-24 py-2"
                            required
                        />
                        <button type="submit" className="btn-primary py-2 px-4 shadow-none">Apply</button>
                    </form>
                </div>
            </div>

            <div className="card mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Driver Average Scores</h2>
                <div className="w-full h-80">
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis domain={[1, 5]} stroke="#64748b" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="rgba(79, 70, 229, 0.1)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Live Feedback Stream</h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Driver Name</th>
                                <th className="p-4 font-semibold text-slate-600">Calculated Sentiment Score</th>
                                <th className="p-4 font-semibold text-slate-600">Raw Feedback</th>
                                <th className="p-4 font-semibold text-slate-600">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {feedbacks.map((fb, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">{fb.driver_name}</td>
                                    <td className="p-4">
                                        <span className={`score-badge ${getBadgeClass(fb.score)}`}>
                                            {fb.score} / 5
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">{fb.text}</td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {new Date(fb.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {feedbacks.length === 0 && <p className="p-8 text-center text-slate-500">No feedback submitted yet.</p>}
                </div>
            </div>

        </div>
    );
}
