import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// const API_URL = 'http://localhost:3001/api';
// deployment changes: use environment variable for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 m-0">
                    <AlertTriangle className="text-rose-500" size={32} /> Risk Incident Management
                </h1>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Open Actionable Alerts</h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Driver Name</th>
                                <th className="p-4 font-semibold text-slate-600">Identified Risk Indicator</th>
                                <th className="p-4 font-semibold text-slate-600">Incident Date</th>
                                <th className="p-4 font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {alerts.map(a => (
                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{a.driver_name}</td>
                                    <td className="p-4 text-rose-500 font-medium">{a.reason}</td>
                                    <td className="p-4 text-slate-500 text-sm">{new Date(a.created_at).toLocaleString()}</td>
                                    <td className="p-4">
                                        <button onClick={() => resolveAlert(a.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-3 rounded-md flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
                                            <CheckCircle size={16} /> Mark Resolved
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {alerts.length === 0 && (
                        <div className="text-center py-12">
                            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                            <p className="text-emerald-600 font-bold text-lg m-0">Zero open alerts. Fleet operation is running smoothly.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
