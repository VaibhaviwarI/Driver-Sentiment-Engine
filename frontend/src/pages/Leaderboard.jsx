import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Medal, Trophy } from 'lucide-react';

// const API_URL = 'http://localhost:3001/api';
// deployment changes: use environment variable for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 m-0">
                    <Trophy className="text-yellow-500" size={32} /> Elite Driver Leaderboard
                </h1>
            </div>

            <div className="card bg-gradient-to-br from-slate-50 to-white shadow-lg border-t-4 border-primary">
                <p className="text-slate-500 mb-8 text-lg">
                    Recognizing drivers with the most exceptional sentiment and safety scores across all operational regions.
                </p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Global Rank</th>
                                <th className="p-4 font-semibold text-slate-600">Driver Name</th>
                                <th className="p-4 font-semibold text-slate-600">Operating Region</th>
                                <th className="p-4 font-semibold text-slate-600">Sentiment Rating (Avg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leaders.map((d, index) => (
                                <tr key={d.id} className={`transition-colors hover:bg-slate-50 ${index === 0 ? 'bg-yellow-50 font-bold' : index === 1 ? 'bg-slate-100 font-bold' : index === 2 ? 'bg-orange-50 font-bold' : ''}`}>
                                    <td className="p-4 text-xl">
                                        {index === 0 ? <Medal className="text-yellow-500" size={28} /> :
                                            index === 1 ? <Medal className="text-slate-400" size={28} /> :
                                                index === 2 ? <Medal className="text-orange-600" size={28} /> :
                                                    <span className="ml-2 text-slate-500 font-medium">#{index + 1}</span>}
                                    </td>
                                    <td className="p-4 text-slate-800">{d.name}</td>
                                    <td className="p-4"><span className="bg-white px-3 py-1 rounded border border-slate-200 text-slate-700">{d.region}</span></td>
                                    <td className="p-4">
                                        <span className="score-badge score-high text-lg px-4 py-1.5 shadow-sm">
                                            {d.average_score.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leaders.length === 0 && <p className="p-8 text-center text-slate-500">Insufficient data to compile the global leaderboard.</p>}
                </div>
            </div>
        </div>
    );
}
