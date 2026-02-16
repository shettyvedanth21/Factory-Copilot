import api, { DATA_SERVICE_BASE } from './api';

/**
 * Fetch latest telemetry for a device
 * @param {string} deviceId - ID of the device
 * @param {object} options - Optional query parameters (limit, start_time, etc)
 */
export const getDeviceTelemetry = async (deviceId, options = {}) => {
    try {
        const params = new URLSearchParams(options).toString();
        const url = `${DATA_SERVICE_BASE}/api/v1/data/telemetry/${deviceId}${params ? `?${params}` : ''}`;
        const response = await api.get(url);

        // The backend returns { success: true, data: { items: [...], total: X, device_id: ... } }
        const data = response.data.data || response.data;
        return data.items || [];
    } catch (error) {
        console.error(`Error fetching telemetry for ${deviceId}:`, error);
        throw error;
    }
};

/**
 * Fetch summary stats for a device
 */
export const getDeviceStats = async (deviceId) => {
    try {
        const response = await api.get(`${DATA_SERVICE_BASE}/api/v1/data/stats/${deviceId}`);
        return response.data.data || response.data;
    } catch (error) {
        console.error(`Error fetching stats for ${deviceId}:`, error);
        throw error;
    }
};
