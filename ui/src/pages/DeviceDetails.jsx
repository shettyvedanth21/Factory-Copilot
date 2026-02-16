import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Bell,
    ClipboardList,
    Settings,
    History,
    Activity,
    Thermometer,
    Gauge,
    Zap,
    Loader2,
    AlertCircle,
    Shield,
    Play,
    Pause,
    Plus
} from 'lucide-react';
import PerformanceChart from '../components/Analytics/PerformanceChart';
import RuleModal from '../components/Rules/RuleModal';
import { getDeviceById } from '../services/deviceService';
import { getDeviceTelemetry } from '../services/telemetryService';
import { listRules, createRule } from '../services/ruleService';
import './DeviceDetails.css';

const MetricCard = ({ title, value, unit, icon: Icon, min, max, optimal, percent }) => (
    <div className="metric-status-card glass-card">
        <div className="m-card-header">
            <div className="m-title-group">
                <Icon size={18} className="m-icon" />
                <span className="m-label">{title.toUpperCase()}</span>
            </div>
            <span className="m-value">{value}<span className="m-unit">{unit}</span></span>
        </div>
        <div className="m-status-bar-container">
            <div className="m-status-bar-bg">
                <div className="m-status-bar-fill" style={{ width: `${percent || 0}%` }}></div>
                <div className="m-status-marker" style={{ left: `${((optimal - min) / (max - min)) * 100}%` }}></div>
            </div>
            <div className="m-range-labels">
                <span>MIN: {min || 0}</span>
                <span>MAX: {max || 100}</span>
                <span className="optimal-tag">OPTIMAL: {optimal || 50}</span>
            </div>
        </div>
    </div>
);

const DeviceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeMetric, setActiveMetric] = useState('efficiency');
    const [device, setDevice] = useState(null);
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeHubTab, setActiveHubTab] = useState(null);
    const [appliedRules, setAppliedRules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    const loadFilteredRules = async (foundDevice) => {
        try {
            const response = await listRules({ deviceId: foundDevice.id, status: 'active' });
            setAppliedRules(response.data || []);
        } catch (error) {
            console.error('Failed to load rules:', error);
            setAppliedRules([]);
        }
    };

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                setLoading(true);
                const foundDevice = await getDeviceById(id);
                if (foundDevice) {
                    setDevice(foundDevice);
                    setError(null);
                    loadFilteredRules(foundDevice);
                } else {
                    setError('The requested equipment could not be found.');
                }
            } catch (err) {
                console.error('Failed to fetch device details:', err);
                setError('Failed to connect to the equipment service. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchDevice();
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const fetchTelemetry = async () => {
            try {
                const data = await getDeviceTelemetry(id, { limit: 50 });
                setTelemetry(data || []);
            } catch (err) {
                console.error('Failed to fetch telemetry:', err);
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [id]);

    // API returns data in descending order (newest first)
    const latest = telemetry.length > 0 ? telemetry[0] : {};

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleAddRule = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleSaveRule = async (ruleData) => {
        try {
            const payload = {
                ruleName: ruleData.name || 'Unnamed Rule',
                description: ruleData.description || '',
                scope: 'device',
                property: ruleData.metric || 'temperature',
                condition: ruleData.operator || '>',
                threshold: parseFloat(ruleData.threshold) || 0,
                notificationChannels: ruleData.channels || [],
                cooldownMinutes: 15,
                deviceIds: [device.id],
            };

            console.log('📤 Creating rule:', payload);
            await createRule(payload);
            await loadFilteredRules(device);
            setIsModalOpen(false);
        } catch (error) {
            console.error('❌ Failed to create rule:', error);
            alert('Failed to create rule. Please try again.');
        }
    };

    // Format telemetry for chart
    // API returns descending order, so reverse for chart (oldest to newest)
    const chartData = telemetry.length > 0
        ? [...telemetry].reverse().map((t, i) => ({
            name: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            voltage: t.voltage || 0,
            current: t.current || 0,
            power: t.power || 0,
            temperature: t.temperature || 0
        }))
        : [
            { name: 'No Data', voltage: 0, current: 0, power: 0, temperature: 0 },
        ];

    const getPercent = (val, min, max) => {
        if (!val) return 0;
        return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    };

    if (loading) {
        return (
            <div className="details-loading">
                <Loader2 className="animate-spin text-secondary" size={48} />
                <p>Syncing device telemetry...</p>
            </div>
        );
    }

    if (error || !device) {
        return (
            <div className="details-error">
                <AlertCircle size={48} className="text-warning" />
                <h3>Device Synchronization Failed</h3>
                <p>{error || 'The requested equipment could not be found.'}</p>
                <button className="btn-dash primary" onClick={() => navigate(-1)}>Return to Fleet</button>
            </div>
        );
    }

    return (
        <div className="device-details-container">
            <header className="details-header-nav">
                <button className="back-btn-minimal" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} />
                    <span>Back to Fleet</span>
                </button>
            </header>

            <main className="details-main-layout">

                {/* Device Information Header */}
                <section className="device-info-panel glass-card">
                    <div className="info-grid-header">
                        <span className="info-title">DEVICE INFORMATION</span>
                        <div className="health-score-container">
                            <span className="health-score-label">HEALTH SCORE</span>
                            <span className={`health-score-value ${device.health < 50 ? 'critical' : device.health < 80 ? 'warning' : ''}`}>
                                {device.health}%
                            </span>
                        </div>
                    </div>

                    <div className="info-details-grid">
                        <div className="info-item">
                            <span className="i-label">NAME</span>
                            <span className="i-value">{device.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">STATUS</span>
                            <span className={`i-value status-${device.status.toLowerCase()}`}>
                                <span className="status-dot"></span>
                                {device.status}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">ID</span>
                            <span className="i-value text-muted">{device.fullId || device.id}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">TYPE</span>
                            <span className="i-value">{device.type}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">LOCATION</span>
                            <span className="i-value">{device.location}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">LAST UPDATE</span>
                            <span className="i-value">{latest.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                    </div>
                </section>

                {/* Metrics Grid */}
                <section className="metrics-summary-grid">
                    <MetricCard
                        title="Voltage (V)"
                        value={latest.voltage || 0}
                        icon={Zap}
                        min={200}
                        max={250}
                        optimal={230}
                        percent={getPercent(latest.voltage, 200, 250)}
                    />
                    <MetricCard
                        title="Current (A)"
                        value={latest.current || 0}
                        icon={Activity}
                        min={0}
                        max={2}
                        optimal={1}
                        percent={getPercent(latest.current, 0, 2)}
                    />
                    <MetricCard
                        title="Power (W)"
                        value={latest.power || 0}
                        icon={Zap}
                        min={0}
                        max={500}
                        optimal={200}
                        percent={getPercent(latest.power, 0, 500)}
                    />
                    <MetricCard
                        title="Temperature (°C)"
                        value={latest.temperature || 0}
                        icon={Thermometer}
                        min={0}
                        max={100}
                        optimal={45}
                        percent={getPercent(latest.temperature, 0, 100)}
                    />
                </section>

                <section className="performance-analytics-section glass-card">
                    <div className="chart-controls-row">
                        <div className="chart-title-stack">
                            <h3>Performance Trends</h3>
                            <span className="subtext">(Recent Telemetry)</span>
                        </div>
                        <div className="metric-toggle-group">
                            <button
                                className={`toggle-tab ${activeMetric === 'voltage' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('voltage')}
                            >
                                Voltage
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'power' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('power')}
                            >
                                Power
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'temperature' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('temperature')}
                            >
                                Temperature
                            </button>
                        </div>
                    </div>

                    <div className="main-chart-area">
                        <PerformanceChart
                            data={chartData}
                            title=""
                            dataKey={activeMetric}
                            color={activeMetric === 'voltage' ? "var(--accent-primary)" : activeMetric === 'power' ? "#fbbf24" : "#f87171"}
                        />
                    </div>
                </section>

                <section className="interaction-hub-grid">
                    <button
                        className={`hub-btn ${activeHubTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'alerts' ? null : 'alerts')}
                    >
                        <div className="hub-icon-box"><Bell size={20} /></div>
                        <span>Alerts</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'maintenance' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'maintenance' ? null : 'maintenance')}
                    >
                        <div className="hub-icon-box"><ClipboardList size={20} /></div>
                        <span>Maintenance Log</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'configuration' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'configuration' ? null : 'configuration')}
                    >
                        <div className="hub-icon-box"><Settings size={20} /></div>
                        <span>Configuration</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'history' ? null : 'history')}
                    >
                        <div className="hub-icon-box"><History size={20} /></div>
                        <span>Historical Data</span>
                    </button>
                </section>

                <AnimatePresence>
                    {activeHubTab && (
                        <motion.section
                            className="hub-content-panel glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            {activeHubTab === 'configuration' && (
                                <div className="applied-rules-container">
                                    <div className="panel-header">
                                        <div className="p-header-top">
                                            <div className="p-title-stack">
                                                <h4>Applied Automation Rules</h4>
                                                <p>Protocols currently governing this asset</p>
                                            </div>
                                            <button className="add-rule-btn-h" onClick={handleAddRule}>
                                                <Plus size={16} />
                                                <span>ADD RULE</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="applied-rules-list">
                                        {appliedRules.length > 0 ? (
                                            appliedRules.map(rule => (
                                                <div key={rule.id} className="applied-rule-card">
                                                    <div className="rule-info">
                                                        <div className="rule-badge">
                                                            <Shield size={14} />
                                                            <span>{rule.name}</span>
                                                        </div>
                                                        <code className="rule-logic-preview">{rule.condition}</code>
                                                    </div>
                                                    <div className="rule-actions-hub">
                                                        <button
                                                            className="edit-rule-btn-mini"
                                                            onClick={() => handleEditRule(rule)}
                                                            title="Edit Rule"
                                                        >
                                                            <Settings size={14} />
                                                        </button>
                                                        <div className="rule-status-tag active">
                                                            <div className="pulse-dot"></div>
                                                            ACTIVE
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state-hub">
                                                <AlertCircle size={24} />
                                                <p>No active rules target this device.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeHubTab === 'alerts' && (
                                <div className="empty-state-hub">
                                    <Bell size={24} />
                                    <p>Recent alerts for this device will appear here.</p>
                                </div>
                            )}
                            {activeHubTab === 'maintenance' && (
                                <div className="empty-state-hub">
                                    <ClipboardList size={24} />
                                    <p>Maintenance and service history logs.</p>
                                </div>
                            )}
                            {activeHubTab === 'history' && (
                                <div className="empty-state-hub">
                                    <History size={24} />
                                    <p>Full historical telemetry data export.</p>
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                <RuleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveRule}
                    editingRule={editingRule}
                />
            </main>
        </div>
    );
};

export default DeviceDetails;
