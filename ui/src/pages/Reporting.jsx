import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    ChevronDown,
    Check,
    BarChart3,
    Clock,
    Layers,
    FileText,
    Send,
    Zap,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { generateReport } from '../services/reportingService';
import './Reporting.css';

const Reporting = () => {
    const [devices, setDevices] = useState('All Machines');
    const [range, setRange] = useState('Last 30 Days');
    const [analysis, setAnalysis] = useState(['Anomaly Detection', 'Failure Prediction']);
    const [format, setFormat] = useState('PDF');
    const [schedule, setSchedule] = useState('One-time');
    const [email, setEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [selectedType, setSelectedType] = useState('Compressors');

    const toggleAnalysis = (item) => {
        setAnalysis(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const generateMockData = () => {
        const timestamp = new Date().toLocaleString();

        // Generate mock events for smart bulbs
        const events = Array.from({ length: 15 }, (_, i) => {
            const isCritical = Math.random() > 0.8;
            const deviceId = `BULB-${100 + Math.floor(Math.random() * 50)}`;
            return {
                id: `EVT-${2000 + i}`,
                timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleString(),
                type: isCritical ? 'Critical Alert' : 'Warning',
                message: isCritical
                    ? (Math.random() > 0.5 ? 'Filament Overheat Detected' : 'Connectivity Lost')
                    : (Math.random() > 0.5 ? 'High Voltage Fluctuation' : 'Unexpected Dimming'),
                device: deviceId,
                metrics: {
                    voltage: (220 + Math.random() * 10 - 5).toFixed(1) + 'V',
                    current: (0.05 + Math.random() * 0.02).toFixed(3) + 'A',
                    power: (9 + Math.random() * 2).toFixed(1) + 'W'
                }
            };
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const data = {
            reportTitle: "Cittagent/FactoryOps - Smart Lighting Analytics",
            generatedAt: timestamp,
            config: {
                devices,
                target: devices === 'Device Type' ? selectedType : 'All Lighting Units',
                range,
                analysisEnabled: analysis,
                format
            },
            summary: {
                totalUptime: "99.92%",
                efficiencyScore: "94.2",
                anomaliesDetected: events.length,
                maintenanceAlerts: events.filter(e => e.type === 'Critical Alert').length,
                energySaved: "1,240 kWh",
                costSavings: "$3,450",
                avgBulbLifespan: "15,000 hrs",
                activeBulbs: 842,
                events: events
            }
        };
        return data;
    };

    const triggerDownload = (data) => {
        let content = '';
        let mimeType = 'text/plain';
        let extension = 'txt';

        if (format === 'JSON') {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else if (format === 'Excel') {
            // Detailed CSV for Excel - Smart Bulb Focus
            const summaryHeaders = ['Report Title', 'Generated At', 'Uptime', 'Efficiency Score', 'Active Bulbs', 'Avg Lifespan', 'Energy Saved', 'Cost Savings'];
            const summaryRow = [
                data.reportTitle,
                data.generatedAt,
                data.summary.totalUptime,
                data.summary.efficiencyScore,
                data.summary.activeBulbs,
                data.summary.avgBulbLifespan,
                data.summary.energySaved,
                data.summary.costSavings
            ];

            const eventHeaders = ['Event ID', 'Timestamp', 'Severity', 'Device (Bulb ID)', 'Message', 'Voltage', 'Current', 'Power'];
            const eventRows = data.summary.events.map(e =>
                [e.id, e.timestamp, e.type, e.device, e.message, e.metrics.voltage, e.metrics.current, e.metrics.power].join(',')
            );

            content = [
                summaryHeaders.join(','),
                summaryRow.join(','),
                '',
                '--- SMART BULB EVENT LOG ---',
                eventHeaders.join(','),
                ...eventRows
            ].join('\n');

            mimeType = 'text/csv';
            extension = 'csv';
        } else {
            // PDF simulation (Rich Text Layout) - Smart Bulb Focus
            content = `
================================================================================
    CITTAGENT / FACTORYOPS - INTELLIGENCE REPORT
================================================================================
REPORT ID: ${Math.floor(Math.random() * 100000)}
GENERATED: ${data.generatedAt}
CONFIDENTIALITY: INTERNAL USE ONLY

--------------------------------------------------------------------------------
1. CONFIGURATION OVERVIEW
--------------------------------------------------------------------------------
Subject Scope:   ${data.config.devices} (${data.config.target})
Time Range:      ${data.config.range}
Analysis Modules:
${data.config.analysisEnabled.map(a => `[x] ${a}`).join('\n')}

--------------------------------------------------------------------------------
2. SYSTEM PERFORMANCE SUMMARY
--------------------------------------------------------------------------------
Operational Uptime:      ${data.summary.totalUptime}
System Efficiency:       ${data.summary.efficiencyScore}/100
Active Units:            ${data.summary.activeBulbs} Bulbs
Avg. Lifespan:           ${data.summary.avgBulbLifespan}
Est. Energy Savings:     ${data.summary.energySaved}
Est. Cost Savings:       ${data.summary.costSavings}

--------------------------------------------------------------------------------
3. ANOMALY & EVENT LOG
--------------------------------------------------------------------------------
TIMESTAMP            | SEVERITY       | DEVICE       | MESSAGE
--------------------------------------------------------------------------------
${data.summary.events.map(e =>
                `${e.timestamp.padEnd(20)} | ${e.type.padEnd(14)} | ${e.device.padEnd(12)} | ${e.message}`
            ).join('\n')}

--------------------------------------------------------------------------------
[END OF REPORT]
            `;
            mimeType = 'text/plain';
            extension = 'pdf.txt'; // Labelled so user knows it's a simulated PDF/Text report
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SmartLightingReport_${new Date().toISOString().split('T')[0]}_${Math.floor(Math.random() * 1000)}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const reportData = generateMockData();
            // Call actual backend service
            await generateReport({
                title: reportData.reportTitle,
                config: reportData.config,
                format: format
            }).catch(err => console.error('Backend generation failed, falling back to client-side:', err));

            triggerDownload(reportData);
            setIsComplete(true);
            setTimeout(() => setIsComplete(false), 3000);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 200 }
        }
    };

    return (
        <motion.div
            className="reporting-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="reporting-workflow-layout">

                {/* Workflow Sidebar/Steps Indicator */}
                <div className="workflow-nav-glass">
                    {[
                        { id: '01', icon: <Layers size={16} />, label: 'Select Devices' },
                        { id: '02', icon: <Clock size={16} />, label: 'Time Range' },
                        { id: '03', icon: <Zap size={16} />, label: 'Analysis Type' },
                        { id: '04', icon: <FileText size={16} />, label: 'Format & Delivery' }
                    ].map((step, idx) => (
                        <div key={step.id} className="workflow-step-link">
                            <div className="step-num-hex">{step.id}</div>
                            <div className="step-label-group">
                                <span className="step-label-mini">{step.label}</span>
                                {idx < 3 && <div className="step-connector-dash" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reporting-main-workspace">

                    {/* STEP 1: SELECT DEVICES */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box blue">
                                <Layers size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Select Devices</h3>
                                <p>Determine the breadth of hardware inclusion</p>
                            </div>
                        </div>

                        <div className="interaction-grid-3">
                            {['All Machines', 'Device Type', 'Specific Devices'].map(mode => (
                                <button
                                    key={mode}
                                    className={`interactive-mode-card ${devices === mode ? 'active' : ''}`}
                                    onClick={() => setDevices(mode)}
                                >
                                    <div className="mode-toggle-ring" />
                                    <span>{mode}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {devices === 'Device Type' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="secondary-config-area"
                                >
                                    <label className="field-label-mini">Target Device Type</label>
                                    <div className="crystal-dropdown">
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="report-hidden-select"
                                        >
                                            <option value="Compressors">Compressors</option>
                                            <option value="Boilers">Boilers</option>
                                            <option value="Pumps">Pumps</option>
                                            <option value="Generators">Generators</option>
                                        </select>
                                        <span>{selectedType}</span>
                                        <ChevronDown size={16} />
                                    </div>
                                </motion.div>
                            )}
                            {devices === 'Specific Devices' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="secondary-config-area"
                                >
                                    <label className="field-label-mini">Selected Unit ID</label>
                                    <div className="input-field-glass mini">
                                        <input type="text" placeholder="D1-COMPRESSOR, B2-BOILER..." />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* STEP 2: TIME RANGE */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box purple">
                                <Clock size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Time Range</h3>
                                <p>Set the data lookback and granularity</p>
                            </div>
                        </div>
                        <div className="flex-wrap-pills">
                            {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Custom Range'].map(t => (
                                <button
                                    key={t}
                                    className={`time-chip-premium ${range === t ? 'active' : ''}`}
                                    onClick={() => setRange(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <AnimatePresence>
                            {range === 'Custom Range' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="custom-range-grid"
                                >
                                    <div className="input-field-glass mini">
                                        <label className="field-label-mini">Start Date</label>
                                        <input type="date" className="date-input-premium" />
                                    </div>
                                    <div className="input-field-glass mini">
                                        <label className="field-label-mini">End Date</label>
                                        <input type="date" className="date-input-premium" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* STEP 3: ANALYSIS TYPE */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box emerald">
                                <Zap size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Analysis Type</h3>
                                <p>Enable specific analytic model inclusions</p>
                            </div>
                        </div>
                        <div className="protocol-checkbox-grid">
                            {[
                                { name: 'Anomaly Detection', desc: 'Identify statistical outliers' },
                                { name: 'Failure Prediction', desc: 'Predict upcoming maintenance needs' },
                                { name: 'Performance Summary', desc: 'Baseline vs actual performance' },
                                { name: 'Forecast Events', desc: 'Forecast future operational events' },
                                { name: 'Maintenance Planning', desc: 'Detailed maintenance schedules' },
                                { name: 'Energy Audit', desc: 'Power usage profiling' }
                            ].map(item => (
                                <div
                                    key={item.name}
                                    className={`logic-checkbox-card ${analysis.includes(item.name) ? 'active' : ''}`}
                                    onClick={() => toggleAnalysis(item.name)}
                                >
                                    <div className="checkbox-frame">
                                        {analysis.includes(item.name) && <Check size={14} />}
                                    </div>
                                    <div className="logic-text">
                                        <span className="logic-name">{item.name}</span>
                                        <span className="logic-desc">{item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* STEP 4: FORMAT & DELIVERY */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box amber">
                                <Send size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Format & Delivery</h3>
                                <p>Define report format and distribution channels</p>
                            </div>
                        </div>

                        <div className="delivery-cols">
                            <div className="format-selection-group">
                                <label className="field-label-mini">Report Format</label>
                                <div className="format-pills-row">
                                    {['PDF', 'Excel', 'JSON'].map(f => (
                                        <button
                                            key={f}
                                            className={`format-btn-mini ${format === f ? 'active' : ''}`}
                                            onClick={() => setFormat(f)}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="delivery-input-group">
                                <label className="field-label-mini">Email Recipients</label>
                                <div className="input-field-glass">
                                    <input
                                        type="text"
                                        placeholder="engineering@factoryops.io"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <FileText size={16} className="input-icon" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ACTION HUB */}
                    <motion.div className="report-action-hub" variants={itemVariants}>
                        <button className="btn-outline-glass">
                            PREVIEW REPORT
                        </button>
                        <button
                            className={`btn-neon-action ${isGenerating ? 'loading' : ''} ${isComplete ? 'success' : ''}`}
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            <AnimatePresence mode="wait">
                                {isGenerating ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="btn-state-content"
                                    >
                                        <Loader2 size={20} className="spinning-icon" />
                                        <span>Generating...</span>
                                    </motion.div>
                                ) : isComplete ? (
                                    <motion.div
                                        key="complete"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="btn-state-content"
                                    >
                                        <CheckCircle2 size={20} />
                                        <span>Complete</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="initial"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="btn-state-content"
                                    >
                                        <Download size={20} />
                                        <span>GENERATE & DOWNLOAD</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </motion.div>

                </div>
            </div>

            {/* Float Toast Feedback */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="status-toast-floating"
                    >
                        <AlertCircle size={20} className="toast-icon" />
                        <span>Report generated successfully. Downloading {format} file.</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Reporting;
