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
        axios.get(`${API_URL}/admin/drivers`).then(res => setDrivers(res.data));
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
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Submit Trip Feedback</h2>
            <p>Your feedback helps us maintain high safety and quality standards.</p>

            {success && (
                <div className="card" style={{ background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 /> Feedback received and queued for processing!
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4">

                <div className="form-group">
                    <label>Select Driver</label>
                    <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} required>
                        <option value="" disabled>Select a driver...</option>
                        {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {/* Dynamically Generated Configurable Form Fields */}

                {config.feature_driver && (
                    <div className="form-group">
                        <label>Driver Feedback</label>
                        <textarea
                            placeholder="How was the driver's behavior and driving? (e.g. Great driver, felt safe)"
                            value={driverText}
                            onChange={e => setDriverText(e.target.value)}
                            required
                        />
                    </div>
                )}

                {config.feature_trip && (
                    <div className="form-group">
                        <label>Trip Experience (Route, Comfort)</label>
                        <textarea
                            placeholder="Any comments on the route or vehicle?"
                            value={tripText}
                            onChange={e => setTripText(e.target.value)}
                        />
                    </div>
                )}

                {config.feature_app && (
                    <div className="form-group">
                        <label>App Experience</label>
                        <textarea
                            placeholder="Did the app work well? Any bugs?"
                            value={appText}
                            onChange={e => setAppText(e.target.value)}
                        />
                    </div>
                )}

                {config.feature_marshal && (
                    <div className="form-group">
                        <label>Security Marshal Routing</label>
                        <textarea
                            placeholder="Was the marshal helpful?"
                            value={marshalText}
                            onChange={e => setMarshalText(e.target.value)}
                        />
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : <><Send size={18} /> Submit Feedback</>}
                </button>
            </form>
        </div>
    );
}
