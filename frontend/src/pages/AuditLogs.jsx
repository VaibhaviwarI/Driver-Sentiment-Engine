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
                <h1 className="flex items-center gap-2">
                    <ShieldCheck color="var(--primary)" size={32} /> System Audit Trail
                </h1>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    Immutable log of all critical administrative actions and system configuration changes for compliance and security traceability.
                </p>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Log ID</th>
                                <th>Action Type</th>
                                <th>Action Details</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>#{log.id}</td>
                                    <td>
                                        <span style={{
                                            background: 'var(--bg-card)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            border: '1px solid var(--border)',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.details}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <Database size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>No audit logs recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
