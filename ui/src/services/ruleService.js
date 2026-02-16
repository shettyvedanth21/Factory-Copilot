import api, { RULE_ENGINE_SERVICE_BASE } from './api';

const mapRule = (r) => ({
    ruleId: r.rule_id,
    ruleName: r.rule_name,
    description: r.description,
    scope: r.scope,
    property: r.property,
    condition: r.condition,
    threshold: r.threshold,
    notificationChannels: r.notification_channels,
    cooldownMinutes: r.cooldown_minutes,
    deviceIds: r.device_ids,
    status: r.status,
    createdAt: r.created_at,
});

export const listRules = async (params = {}) => {
    try {
        const query = new URLSearchParams();
        if (params.deviceId) query.append("device_id", params.deviceId);
        if (params.status) query.append("status", params.status);
        query.append("page", params.page || 1);
        query.append("page_size", params.pageSize || 20);

        const response = await api.get(`${RULE_ENGINE_SERVICE_BASE}/api/v1/rules?${query.toString()}`);
        const json = response.data;

        return {
            data: (json.data || []).map(mapRule),
            total: json.total || 0,
        };
    } catch (error) {
        console.error('Error listing rules:', error);
        throw error;
    }
};

export const createRule = async (payload) => {
    console.log('🚀 SENDING CREATE RULE PAYLOAD:', payload);
    try {
        const response = await api.post(`${RULE_ENGINE_SERVICE_BASE}/api/v1/rules`, {
            rule_name: payload.ruleName || "Unnamed Rule",
            description: payload.description || "",
            scope: payload.scope || "selected_devices",
            property: payload.property || "temperature",
            condition: payload.condition || ">",
            threshold: typeof payload.threshold === 'number' ? payload.threshold : 0.0,
            notification_channels: Array.isArray(payload.notificationChannels) ? payload.notificationChannels : ["email"],
            cooldown_minutes: payload.cooldownMinutes || 15,
            device_ids: Array.isArray(payload.deviceIds) ? payload.deviceIds : [],
        });
        console.log('✅ CREATE RULE SUCCESS:', response.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ ERROR CREATING RULE (Detailed):', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            payload
        });
        if (error.response?.data) {
            console.log('📜 SERVER ERROR DETAIL:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
};

export const updateRule = async (ruleId, payload) => {
    console.log(`🚀 UPDATING RULE ${ruleId} PAYLOAD:`, payload);
    try {
        const response = await api.put(`${RULE_ENGINE_SERVICE_BASE}/api/v1/rules/${ruleId}`, {
            rule_name: payload.ruleName,
            description: payload.description,
            scope: payload.scope,
            property: payload.property,
            condition: payload.condition,
            threshold: typeof payload.threshold === 'number' ? payload.threshold : undefined,
            notification_channels: payload.notificationChannels,
            cooldown_minutes: payload.cooldownMinutes,
            device_ids: payload.deviceIds,
        });
        console.log('✅ UPDATE RULE SUCCESS:', response.data);
        return response.data.data;
    } catch (error) {
        console.error('❌ ERROR UPDATING RULE:', error);
        throw error;
    }
};

export const updateRuleStatus = async (ruleId, status) => {
    try {
        const response = await api.patch(`${RULE_ENGINE_SERVICE_BASE}/api/v1/rules/${ruleId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error(`Error updating rule ${ruleId} status:`, error);
        throw error;
    }
};

export const deleteRule = async (ruleId) => {
    try {
        const response = await api.delete(`${RULE_ENGINE_SERVICE_BASE}/api/v1/rules/${ruleId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting rule ${ruleId}:`, error);
        throw error;
    }
};
