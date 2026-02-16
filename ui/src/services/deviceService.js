import api, { DEVICE_SERVICE_BASE } from './api';

/**
 * Mapping function to transform backend device shape to UI shape
 */
const mapDevice = (d) => ({
    id: d.id || d.device_id, // Support both if naming varies
    name: d.name || d.device_name,
    type: d.type || d.device_type,
    status: d.status,
    location: d.location || "",
    health: d.health || 100, // Default health if not provided
    lastUpdate: d.last_update || d.lastActive || "Just now"
});

export const getDevices = async () => {
    try {
        const response = await api.get(`${DEVICE_SERVICE_BASE}/api/v1/devices`);
        const data = response.data.data || response.data;
        const items = Array.isArray(data) ? data : (data.items || []);
        console.log('📋 DEVICE LIST API RESPONSE:', { data, items, itemsLength: items.length });

        // Workaround: If list is empty, try fetching D1 directly
        if (items.length === 0) {
            console.log('⚠️ Device list empty, trying D1 fallback...');
            try {
                const d1Response = await api.get(`${DEVICE_SERVICE_BASE}/api/v1/devices/D1`);
                const d1Data = d1Response.data.data || d1Response.data;
                console.log('✅ D1 FALLBACK DATA:', d1Data);
                if (d1Data && d1Data.device_id) {
                    const mapped = mapDevice(d1Data);
                    console.log('✅ D1 MAPPED:', mapped);
                    return [mapped];
                }
            } catch (d1Error) {
                console.error('❌ D1 device not found:', d1Error);
            }
        }

        const mappedItems = items.map(mapDevice);
        console.log('📤 RETURNING DEVICES:', mappedItems);
        return mappedItems;
    } catch (error) {
        console.error('Error fetching devices:', error);
        throw error;
    }
};

export const getDeviceById = async (deviceId) => {
    try {
        const response = await api.get(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}`);
        const data = response.data.data || response.data;
        return data ? mapDevice(data) : null;
    } catch (error) {
        console.error(`Error fetching device ${deviceId}:`, error);
        throw error;
    }
};
