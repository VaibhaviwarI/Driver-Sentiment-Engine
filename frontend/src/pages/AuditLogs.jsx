import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, ShieldCheck } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/audit-logs`);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 m-0">
                    <ShieldCheck className="text-primary" size={32} /> System Audit Trail
                </h1>
            </div>

            <div className="card border-t-4 border-t-primary">
                <p className="text-slate-500 mb-6 text-lg">
                    Immutable log of all critical administrative actions and system configuration changes for compliance and security traceability.
                </p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Log ID</th>
                                <th className="p-4 font-semibold text-slate-600">Action Type</th>
                                <th className="p-4 font-semibold text-slate-600">Action Details</th>
                                <th className="p-4 font-semibold text-slate-600">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-400 font-medium">#{log.id}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md border border-slate-200 font-semibold text-sm">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">{log.details}</td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && (
                        <div className="text-center py-12">
                            <Database size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg m-0">No audit logs recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
