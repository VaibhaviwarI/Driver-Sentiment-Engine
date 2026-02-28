import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function Feedback() {
    const [config, setConfig] = useState(null);
    const [drivers, setDrivers] = useState([]);

    // Form State
    const [selectedDriver, setSelectedDriver] = useState('');
    const [driverText, setDriverText] = useState('');
    const [tripText, setTripText] = useState('');
    const [appText, setAppText] = useState('');
    const [marshalText, setMarshalText] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Fetch UI Feature Flags to build dynamic form
        axios.get(`${API_URL}/config/ui`).then(res => setConfig(res.data));

        // Fetch Drivers for dropdown
        axios.get(`${API_URL}/drivers`).then(res => setDrivers(res.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDriver || (!driverText && !tripText && !appText && !marshalText)) {
            alert("Please select a driver and provide some feedback.");
            return;
        }

        setLoading(true);
        try {
            // In a real app, we'd send all feedback fields.
            // For this engine, we focus purely on Driver Sentiment.
            if (driverText) {
                await axios.post(`${API_URL}/feedback`, {
                    driverId: selectedDriver,
                    text: driverText
                });
            }

            setSuccess(true);
            setDriverText('');
            setTripText('');
            setAppText('');
            setMarshalText('');
            setSelectedDriver('');

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            alert("Error submitting feedback");
        } finally {
            setLoading(false);
        }
    };

    if (!config) return <p>Loading configurable form...</p>;

    return (
        <div className="card shadow-md max-w-2xl mx-auto my-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Submit Trip Feedback</h2>
            <p className="text-slate-500 mb-6">Your feedback helps us maintain high safety and quality standards.</p>

            {success && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg mb-6 flex items-center gap-3 font-medium">
                    <CheckCircle2 className="text-emerald-500" /> Feedback received and queued for processing!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                <div>
                    <label className="form-label">Select Driver</label>
                    <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="form-input" required>
                        <option value="" disabled>Select a driver...</option>
                        {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {/* Dynamically Generated Configurable Form Fields */}

                {config.feature_driver && (
                    <div>
                        <label className="form-label">Driver Feedback</label>
                        <textarea
                            placeholder="How was the driver's behavior and driving? (e.g. Great driver, felt safe)"
                            value={driverText}
                            onChange={e => setDriverText(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                )}

                {config.feature_trip && (
                    <div>
                        <label className="form-label">Trip Experience (Route, Comfort)</label>
                        <textarea
                            placeholder="Any comments on the route or vehicle?"
                            value={tripText}
                            onChange={e => setTripText(e.target.value)}
                            className="form-input"
                        />
                    </div>
                )}

                {config.feature_app && (
                    <div>
                        <label className="form-label">App Experience</label>
                        <textarea
                            placeholder="Did the app work well? Any bugs?"
                            value={appText}
                            onChange={e => setAppText(e.target.value)}
                            className="form-input"
                        />
                    </div>
                )}

                {config.feature_marshal && (
                    <div>
                        <label className="form-label">Security Marshal Routing</label>
                        <textarea
                            placeholder="Was the marshal helpful?"
                            value={marshalText}
                            onChange={e => setMarshalText(e.target.value)}
                            className="form-input"
                        />
                    </div>
                )}

                <button type="submit" className="btn-primary w-full justify-center text-lg mt-4" disabled={loading}>
                    {loading ? 'Submitting...' : <><Send size={20} /> Submit Feedback</>}
                </button>
            </form>
        </div>
    );
}
