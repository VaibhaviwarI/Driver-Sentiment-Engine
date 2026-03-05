import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Map, Users, TrendingUp } from 'lucide-react';

// const API_URL = 'http://localhost:3001/api';
// deployment changes: use environment variable for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 m-0">
                    <Map className="text-primary" size={32} /> Fleet Operations by Region
                </h1>
                <div className="card mb-0 flex items-center gap-4 py-3 px-5">
                    <label className="font-semibold text-slate-700 m-0">Active Region View:</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="form-input py-2">
                        <option value="North">North Region</option>
                        <option value="South">South Region</option>
                        <option value="East">East Region</option>
                        <option value="West">West Region</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card text-center border-t-4 border-t-emerald-500 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-medium text-emerald-600 mb-2">Low Risk Drivers</h3>
                    <div className="text-4xl font-bold text-emerald-500 mb-1">{riskStats.low}</div>
                    <p className="text-slate-500 text-sm m-0">Score &gt; 3.5</p>
                </div>
                <div className="card text-center border-t-4 border-t-amber-500 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-medium text-amber-600 mb-2">Medium Risk Drivers</h3>
                    <div className="text-4xl font-bold text-amber-500 mb-1">{riskStats.medium}</div>
                    <p className="text-slate-500 text-sm m-0">Score 2.5 - 3.5</p>
                </div>
                <div className="card text-center border-t-4 border-t-rose-500 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-medium text-rose-600 mb-2">High Risk Drivers</h3>
                    <div className="text-4xl font-bold text-rose-500 mb-1">{riskStats.high}</div>
                    <p className="text-slate-500 text-sm m-0">Score &lt; 2.5</p>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Users size={24} className="mr-3 text-primary" /> Allocated Drivers - {region}
                </h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Driver ID</th>
                                <th className="p-4 font-semibold text-slate-600">Driver Name</th>
                                <th className="p-4 font-semibold text-slate-600">Sentiment / Safety Score</th>
                                <th className="p-4 font-semibold text-slate-600">Total Commutes Tracked</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {drivers.map(d => (
                                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 font-medium">#{d.id}</td>
                                    <td className="p-4 text-slate-800">{d.name}</td>
                                    <td className="p-4">
                                        <span className={`score-badge ${d.average_score >= 4 ? 'score-high' : d.average_score >= 2.5 ? 'score-mid' : 'score-low'}`}>
                                            {d.average_score > 0 ? d.average_score.toFixed(2) : 'No Data'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">{d.feedback_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {drivers.length === 0 && <p className="p-8 text-center text-slate-500">No active drivers found for this territory.</p>}
                </div>
            </div>
        </div>
    );
}
