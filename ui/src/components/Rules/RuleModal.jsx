import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import './RuleModal.css';
import { getDevices } from '../../services/deviceService';

const METRICS = [
    'Temperature',
    'Pressure',
    'Efficiency',
    'Vibration',
    'Power',
    'Humidity',
    'Flow Rate',
    'Voltage',
    'Current',
    'Noise Level',
    'Cycle Time'
];
const OPERATORS = ['>', '<', '==', '>=', '<='];
const TARGETS = ['All Machines', 'Specific Devices', 'Device Type'];
const CHANNELS = ['Email', 'In-app', 'SMS', 'WhatsApp', 'Telegram', 'Webhook'];

const UNIT_MAP = {
    'Temperature': '°C',
    'Pressure': 'psi',
    'Efficiency': '%',
    'Vibration': 'mm/s',
    'Power': 'kW',
    'Humidity': '%',
    'Flow Rate': 'L/min',
    'Voltage': 'V',
    'Current': 'A',
    'Noise Level': 'dB',
    'Cycle Time': 's'
};

const RuleModal = ({ isOpen, onClose, onSave, editingRule }) => {
    const [name, setName] = useState('');
    const [target, setTarget] = useState('Specific Devices');
    const [selectedDevice, setSelectedDevice] = useState('');
    const [selectedType, setSelectedType] = useState('Compressors');
    const [conditions, setConditions] = useState([
        { metric: 'Temperature', operator: '>', value: '95', logic: 'AND' }
    ]);
    const [selectedChannels, setSelectedChannels] = useState(['Email', 'In-app']);
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    // Fetch devices from API
    const fetchDevices = async () => {
        try {
            setLoadingDevices(true);
            const deviceList = await getDevices();
            setDevices(deviceList);
            // Set first device as default if available
            if (deviceList.length > 0 && !selectedDevice) {
                setSelectedDevice(deviceList[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            setDevices([]);
        } finally {
            setLoadingDevices(false);
        }
    };

    // Fetch devices when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchDevices();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingRule) {
            setName(editingRule.name || '');
            setTarget(editingRule.devices === 'All Machines' ? 'All Machines' : 'Specific Devices');
            setSelectedDevice(editingRule.devices !== 'All Machines' ? editingRule.devices : '');

            if (editingRule.conditions && editingRule.conditions.length > 0) {
                setConditions(editingRule.conditions);
            } else {
                // Fallback for legacy rules
                setConditions([{
                    metric: editingRule.metric || 'Temperature',
                    operator: editingRule.operator || '>',
                    value: editingRule.value || '95',
                    logic: 'AND'
                }]);
            }
            // Attempt to parse channels or use defaults
            setSelectedChannels(['Email', 'In-app']);
        } else {
            setName('');
            setTarget('Specific Devices');
            setConditions([{ metric: 'Temperature', operator: '>', value: '95', logic: 'AND' }]);
            setSelectedChannels(['Email', 'In-app']);
        }
    }, [editingRule, isOpen]);

    const handleChannelToggle = (channel) => {
        setSelectedChannels(prev =>
            prev.includes(channel)
                ? prev.filter(c => c !== channel)
                : [...prev, channel]
        );
    };

    const addCondition = () => {
        setConditions([...conditions, { metric: 'Pressure', operator: '>', value: '100', logic: 'AND' }]);
    };

    const removeCondition = (index) => {
        if (conditions.length <= 1) return;
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index, updates) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        setConditions(newConditions);
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        const firstCond = conditions[0];

        // Map channel labels to lowercase enums supported by backend
        const channelMap = {
            'Email': 'email',
            'WhatsApp': 'whatsapp',
            'Telegram': 'telegram'
        };
        const mappedChannels = selectedChannels
            .map(c => channelMap[c])
            .filter(Boolean);

        // Fallback to at least one channel if none matched, as backend requires min_length=1
        if (mappedChannels.length === 0) mappedChannels.push('email');

        // Map operators (backend uses = instead of ==)
        const operatorMap = {
            '==': '=',
            '>': '>',
            '<': '<',
            '>=': '>=',
            '<=': '<='
        };

        const ruleData = {
            ruleName: name,
            description: `Automation rule for ${name}`,
            scope: target === 'All Machines' ? 'all_devices' : 'selected_devices',
            deviceIds: target === 'Specific Devices' ? (selectedDevice ? [selectedDevice] : []) : [],
            property: firstCond.metric.toLowerCase(),
            condition: operatorMap[firstCond.operator] || firstCond.operator,
            threshold: isNaN(parseFloat(firstCond.value)) ? 0.0 : parseFloat(firstCond.value),
            notificationChannels: mappedChannels,
            cooldownMinutes: 15,

            // UI-only properties for local display if needed
            target,
            conditions,
            icon: firstCond.metric === 'Temperature' ? 'Flame' : firstCond.metric === 'Pressure' ? 'Droplet' : 'Zap',
            type: firstCond.metric === 'Temperature' || firstCond.metric === 'Pressure' ? 'danger' : 'warning',
        };

        // DEBUG: Alert the payload for verification
        alert("Submitting Rule:\n" + JSON.stringify(ruleData, null, 2));

        onSave(ruleData);
    };
    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="rule-modal-overlay">
                    <motion.div
                        className="rule-modal-container"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <header className="rule-modal-header">
                            <h2>{editingRule ? 'Edit Rule' : 'Create New Rule'}</h2>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>

                        <div className="rule-modal-content">
                            {/* General Configuration */}
                            <section className="modal-section">
                                <span className="section-label">GENERAL CONFIGURATION</span>
                                <div className="form-group">
                                    <label>Rule Name</label>
                                    <input
                                        type="text"
                                        placeholder="High Temperature Alert"
                                        className="rule-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="target-selector">
                                    {TARGETS.map(t => (
                                        <motion.div
                                            key={t}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`target-option ${target === t ? 'active' : ''}`}
                                            onClick={() => setTarget(t)}
                                        >
                                            <div className="radio-circle">
                                                {target === t && <div className="radio-inner"></div>}
                                            </div>
                                            <span>{t}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {target === 'Specific Devices' && (
                                    <motion.div
                                        className="form-group device-selection-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{ marginTop: '1.5rem', overflow: 'hidden' }}
                                    >
                                        <label>Select Target Device</label>
                                        <div className="select-wrapper">
                                            <select
                                                className="rule-input-select"
                                                value={selectedDevice}
                                                onChange={(e) => setSelectedDevice(e.target.value)}
                                                disabled={loadingDevices}
                                            >
                                                {loadingDevices ? (
                                                    <option value="">Loading devices...</option>
                                                ) : devices.length === 0 ? (
                                                    <option value="">No devices available</option>
                                                ) : (
                                                    devices.map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.id} - {d.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                                {target === 'Device Type' && (
                                    <motion.div
                                        className="form-group device-selection-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{ marginTop: '1.5rem', overflow: 'hidden' }}
                                    >
                                        <label>Select Device Category</label>
                                        <div className="select-wrapper">
                                            <select
                                                className="rule-input-select"
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                <option value="Compressors">Compressors</option>
                                                <option value="Boilers">Boilers</option>
                                                <option value="Pumps">Pumps</option>
                                                <option value="Generators">Generators</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                            </section>

                            {/* Logic Condition */}
                            <section className="modal-section">
                                <span className="section-label">LOGIC CONDITION PROTOCOLS</span>

                                {conditions.map((cond, idx) => (
                                    <div key={idx} className="condition-row-wrapper">
                                        {idx > 0 && (
                                            <div className="logic-connector-row">
                                                <div className="connector-line"></div>
                                                <div className="logic-toggle-btns">
                                                    <button
                                                        className={`logic-btn ${cond.logic === 'AND' ? 'active' : ''}`}
                                                        onClick={() => updateCondition(idx, { logic: 'AND' })}
                                                    >AND</button>
                                                    <button
                                                        className={`logic-btn ${cond.logic === 'OR' ? 'active' : ''}`}
                                                        onClick={() => updateCondition(idx, { logic: 'OR' })}
                                                    >OR</button>
                                                </div>
                                                <div className="connector-line"></div>
                                            </div>
                                        )}

                                        <div className="logic-row">
                                            <div className="select-wrapper">
                                                <select
                                                    className="rule-input-select"
                                                    value={cond.metric}
                                                    onChange={(e) => updateCondition(idx, { metric: e.target.value })}
                                                >
                                                    {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div className="select-wrapper operator">
                                                <select
                                                    className="rule-input-select"
                                                    value={cond.operator}
                                                    onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                                                >
                                                    {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <div className="value-input-group">
                                                <input
                                                    type="text"
                                                    className="rule-input value-field"
                                                    value={cond.value}
                                                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                                />
                                                <span className="unit">
                                                    {UNIT_MAP[cond.metric] || ''}
                                                </span>
                                            </div>

                                            {conditions.length > 1 && (
                                                <button
                                                    className="remove-cond-btn"
                                                    onClick={() => removeCondition(idx)}
                                                    title="Remove Condition"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    className="add-condition-btn"
                                    onClick={addCondition}
                                >
                                    + Add Another Condition (AND/OR)
                                </button>
                            </section>

                            {/* Notification Channels */}
                            <section className="modal-section">
                                <span className="section-label">NOTIFICATION CHANNELS</span>
                                <div className="channels-grid">
                                    {CHANNELS.map((label) => (
                                        <motion.label
                                            key={label}
                                            className="checkbox-item"
                                            whileHover={{ x: 4 }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedChannels.includes(label)}
                                                onChange={() => handleChannelToggle(label)}
                                            />
                                            <span className="checkmark"></span>
                                            <span className="label-text">{label}</span>
                                        </motion.label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <footer className="rule-modal-footer">
                            <button className="modal-btn outline" onClick={onClose}>CANCEL</button>
                            <div className="footer-actions">
                                <button className="modal-btn outline secondary">SAVE AS TEMPLATE</button>
                                <button
                                    className="modal-btn btn-neon"
                                    onClick={handleSubmit}
                                >
                                    {editingRule ? 'UPDATE RULE' : 'ACTIVATE RULE'}
                                </button>
                            </div>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RuleModal;
