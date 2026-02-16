import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Loader2
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { getDevices } from '../services/deviceService';
import {
    listDatasets,
    runAnalyticsJob,
    getJobStatus,
    getAnalyticsResults
} from '../services/analyticsService';
import './Analytics.css';

const Analytics = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Configuration State
    const [selectedDevice, setSelectedDevice] = useState('');
    const [analysisType, setAnalysisType] = useState('anomaly'); // enum value
    const [model, setModel] = useState('isolation_forest');
    const [dataset, setDataset] = useState('');
    const [availableDatasets, setAvailableDatasets] = useState([]);

    // Job State
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null); // 'pending', 'running', 'completed', 'failed'
    const [results, setResults] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

    // Polling Ref to avoid closure staleness if needed, though simple effect works too
    const pollInterval = useRef(null);

    // Initial Load
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoading(true);
                const data = await getDevices();
                setDevices(data);
                if (data.length > 0) {
                    setSelectedDevice(data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch devices:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDevices();
    }, []);

    // Load datasets when device changes
    useEffect(() => {
        if (!selectedDevice) return;

        const fetchDatasets = async () => {
            const datasets = await listDatasets(selectedDevice);
            setAvailableDatasets(datasets);
            if (datasets.length > 0) {
                setDataset(datasets[0].key || datasets[0]); // Handle object or string
            } else {
                setDataset('');
            }
        };
        fetchDatasets();
    }, [selectedDevice]);

    // Polling Logic
    useEffect(() => {
        if (isPolling && jobId) {
            pollInterval.current = setInterval(async () => {
                try {
                    const statusData = await getJobStatus(jobId);
                    setJobStatus(statusData.status);

                    if (statusData.status === 'completed') {
                        clearInterval(pollInterval.current);
                        setIsPolling(false);
                        const resultData = await getAnalyticsResults(jobId);
                        setResults(resultData);
                    } else if (statusData.status === 'failed') {
                        clearInterval(pollInterval.current);
                        setIsPolling(false);
                        console.error('Job failed:', statusData.message);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                    clearInterval(pollInterval.current);
                    setIsPolling(false);
                }
            }, 2000);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isPolling, jobId]);

    const handleRunAnalysis = async () => {
        if (!selectedDevice || !dataset) return;

        try {
            setJobStatus('pending');
            setResults(null);

            const requestData = {
                device_id: selectedDevice,
                dataset_key: dataset,
                analysis_type: analysisType,
                model_name: model
            };

            const response = await runAnalyticsJob(requestData);
            setJobId(response.job_id);
            setJobStatus('running'); // Optimistic update
            setIsPolling(true);
        } catch (err) {
            console.error('Failed to start job:', err);
            setJobStatus('failed');
            alert('Failed to start analysis job. Check console.');
        }
    };

    // Helper to format timestamps for chart
    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Prepare chart data if results exist
    const chartData = React.useMemo(() => {
        if (!results || !results.results || !Array.isArray(results.results.is_anomaly)) {
            return [];
        }

        try {
            return results.results.is_anomaly.map((isAnomaly, index) => ({
                timestamp: results.results.timestamp && results.results.timestamp[index] ? results.results.timestamp[index] : new Date().toISOString(),
                value: results.results.value && results.results.value[index] !== undefined ? results.results.value[index] : 0,
                score: results.results.anomaly_score && results.results.anomaly_score[index] !== undefined ? results.results.anomaly_score[index] : 0,
                isAnomaly: isAnomaly === -1 // Isolation Forest: -1 is anomaly
            }));
        } catch (e) {
            console.error("Error processing chart data:", e);
            return [];
        }
    }, [results]);

    // Calculate metrics
    const totalPoints = chartData.length;
    const totalAnomalies = chartData.filter(d => d.isAnomaly).length;
    const anomalyPercentage = totalPoints > 0 ? ((totalAnomalies / totalPoints) * 100).toFixed(2) : 0;

    if (loading) {
        return (
            <div className="analytics-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading Configuration...</p>
            </div>
        );
    }

    return (
        <div className="analytics-page-root">
            <header className="analytics-header">
                <h1>Analytics</h1>
                <p>Run AI-powered analytics on your machine data</p>
            </header>

            {/* CONFIGURATION CARD */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="analysis-config-card glass-card"
            >
                <div className="config-header">
                    <h3>Analysis Configuration</h3>
                    <button className="btn-export">Export latest data</button>
                </div>

                <div className="config-form">
                    <div className="config-row">
                        <div className="form-group">
                            <label>Machine</label>
                            <div className="select-wrapper">
                                <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
                                    {Array.isArray(devices) && devices.map(dev => (
                                        <option key={dev.id} value={dev.id}>{dev.name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="select-arrow" size={16} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Analysis Type</label>
                            <div className="select-wrapper">
                                <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
                                    <option value="anomaly">Anomaly Detection</option>
                                    <option value="prediction">Failure Prediction</option>
                                    <option value="forecast">Forecasting</option>
                                </select>
                                <ChevronRight className="select-arrow" size={16} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Model</label>
                            <div className="select-wrapper">
                                <select value={model} onChange={(e) => setModel(e.target.value)}>
                                    <option value="isolation_forest">isolation_forest</option>
                                    <option value="autoencoder">autoencoder</option>
                                    <option value="lstm">lstm</option>
                                </select>
                                <ChevronRight className="select-arrow" size={16} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Dataset</label>
                            <div className="select-wrapper">
                                <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
                                    {Array.isArray(availableDatasets) && availableDatasets.length > 0 ? (
                                        availableDatasets.map((ds, i) => (
                                            <option key={i} value={ds.key || ds}>{ds.key || ds}</option>
                                        ))
                                    ) : (
                                        <option value="">No datasets found</option>
                                    )}
                                </select>
                                <ChevronRight className="select-arrow" size={16} />
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-train primary"
                        onClick={handleRunAnalysis}
                        disabled={isPolling || !dataset}
                    >
                        {isPolling ? (
                            <><Loader2 className="animate-spin" size={16} /> Processing...</>
                        ) : 'Create Model & Start Training'}
                    </button>
                </div>
            </motion.div>

            {/* JOB STATUS & RESULTS */}
            {jobId && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="job-dashboard"
                >
                    {/* JOB STATUS CARD */}
                    <div className="job-status-card glass-card">
                        <h3>Job Status</h3>
                        <div className="job-meta">
                            <span className="job-id-label">Job ID: {jobId}</span>
                            <span className={`status-badge ${jobStatus}`}>
                                {jobStatus === 'running' && <Loader2 className="animate-spin" size={14} />}
                                {jobStatus?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* RESULTS SECTION (Only if completed) */}
                    {jobStatus === 'completed' && results && (
                        <div className="analysis-results-section">
                            <h3>Analysis Results</h3>

                            {/* METRICS GRID */}
                            <div className="results-metrics-grid">
                                <div className="metric-card glass-card">
                                    <span className="metric-label">Total points</span>
                                    <span className="metric-value">{totalPoints}</span>
                                </div>
                                <div className="metric-card glass-card">
                                    <span className="metric-label">Total anomalies</span>
                                    <span className="metric-value">{totalAnomalies}</span>
                                </div>
                                <div className="metric-card glass-card">
                                    <span className="metric-label">Anomaly percentage</span>
                                    <span className="metric-value">{anomalyPercentage}%</span>
                                </div>
                            </div>

                            {/* CHART */}
                            <div className="chart-container glass-card">
                                <h4>Anomaly Detection</h4>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={formatTime}
                                                stroke="rgba(255,255,255,0.3)"
                                            />
                                            <YAxis stroke="rgba(255,255,255,0.3)" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                            />
                                            <ReferenceLine y={0} stroke="#3b82f6" />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#3b82f6"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                            {/* Red dots for anomalies */}
                                            <Line
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#ef4444"
                                                strokeDasharray="5 5"
                                                dot={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    if (payload.isAnomaly) {
                                                        return (
                                                            <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="none" />
                                                        );
                                                    }
                                                    return null;
                                                }}
                                                strokeWidth={1}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-legend">
                                    <span className="legend-item"><span className="dot red"></span>Anomaly Score</span>
                                    <span className="legend-item"><span className="dot blue"></span>Value</span>
                                </div>
                            </div>

                            {/* RESULTS TABLE */}
                            <div className="results-table-container glass-card">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Status</th>
                                            <th>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chartData.slice(0, 50).map((row, i) => (
                                            <tr key={i}>
                                                <td>{new Date(row.timestamp).toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-pill ${row.isAnomaly ? 'anomaly' : 'normal'}`}>
                                                        {row.isAnomaly ? 'Anomaly' : 'Normal'}
                                                    </span>
                                                </td>
                                                <td>{typeof row.score === 'number' ? row.score.toFixed(4) : row.score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Analytics;
