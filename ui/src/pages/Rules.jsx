import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Play, Pause, Settings, Shield, Zap, Flame, Droplet, Activity, Check, Trash2 } from 'lucide-react';
import DataTable from '../components/Shared/DataTable';
import RuleModal from '../components/Rules/RuleModal';
import './Rules.css';
import { listRules, createRule, updateRule, updateRuleStatus, deleteRule } from '../services/ruleService';

const DEFAULT_RULES = [
    {
        ruleId: 'mock-1',
        ruleName: 'High Pressure Alert',
        devices: 'D1, D3',
        condition: 'Pressure > 130 psi',
        status: 'Active',
        type: 'danger',
        icon: 'Flame',
        metric: 'Pressure',
        operator: '>',
        value: '130'
    },
    // ... other mock rules as fallback
];

const ICON_MAP = {
    Flame: <Flame size={16} />,
    Zap: <Zap size={16} />,
    Activity: <Activity size={16} />,
    Droplet: <Droplet size={16} />,
    Shield: <Shield size={16} />
};


const Rules = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await listRules();
            const mappedData = response.data.map(r => ({
                ...r,
                id: r.ruleId,
                name: r.ruleName,
                devices: r.deviceIds ? r.deviceIds.join(', ') : 'All Devices'
            }));
            setRules(mappedData);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
            setError('Automation service unreachable.');
            setRules([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleToggleStatus = async (id) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;

        const newStatus = rule.status === 'active' || rule.status === 'Active' ? 'paused' : 'active';
        try {
            await updateRuleStatus(id, newStatus);
            fetchRules();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDeleteRule = async (id) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            try {
                await deleteRule(id);
                fetchRules();
            } catch (error) {
                console.error('Failed to delete rule:', error);
            }
        }
    };

    const handleAddOrUpdateRule = async (ruleData) => {
        try {
            if (editingRule) {
                await updateRule(editingRule.id, ruleData);
            } else {
                await createRule(ruleData);
            }
            fetchRules();
            setIsModalOpen(false);
            setEditingRule(null);
        } catch (error) {
            console.error('Failed to save rule:', error);
        }
    };

    const handleEditClick = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const filteredRules = rules.filter(rule =>
        (rule.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.devices || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            header: 'Rule Name',
            accessor: 'name',
            render: (name, row) => (
                <div className={`rule-name-cell ${row.type}`}>
                    <div className="rule-icon-box">
                        {ICON_MAP[row.icon] || <Shield size={16} />}
                    </div>
                    <span>{name}</span>
                </div>
            )
        },
        { header: 'Affected Assets', accessor: 'devices' },
        {
            header: 'Logic Protocol',
            accessor: 'condition',
            render: (cond, row) => <code className={`rule-code-premium ${row.type}`}>{cond}</code>
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (status) => (
                <span className={`status-pill-minimal ${status.toLowerCase()}`}>
                    {status.toLowerCase() === 'active' ? (
                        <Check size={12} className="status-icon-svg" />
                    ) : (
                        <span className="dot" />
                    )}
                    {status}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: 'id',
            render: (id, row) => (
                <div className="table-actions-premium">
                    <button
                        className={`control-icon-btn small ${row.status === 'Active' ? 'active' : ''}`}
                        title={row.status === 'Active' ? 'Pause Protocol' : 'Activate Protocol'}
                        onClick={() => handleToggleStatus(row.id)}
                    >
                        {row.status === 'Active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        className="control-icon-btn small"
                        title="Configure Logic"
                        onClick={() => handleEditClick(row)}
                    >
                        <Settings size={16} />
                    </button>
                    <button
                        className="control-icon-btn small danger"
                        title="Delete Rule"
                        onClick={() => handleDeleteRule(row.id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="rules-container">


            <div className="rules-toolbar-premium">
                <div className="rules-actions-row">
                    <div className="search-box-premium">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Filter protocols..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-hub-btns">
                        <button
                            className="btn-neon"
                            onClick={handleCreateClick}
                        >
                            <Plus size={20} />
                            Create Rule
                        </button>
                    </div>
                </div>
            </div>

            {/* Crystalline Data Hub */}
            <div className="rules-content-hub">
                <DataTable
                    title="Active Automation Protocols"
                    columns={columns}
                    data={filteredRules}
                />
            </div>

            <RuleModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRule(null);
                }}
                onSave={handleAddOrUpdateRule}
                editingRule={editingRule}
            />

        </div >
    );
};

export default Rules;
