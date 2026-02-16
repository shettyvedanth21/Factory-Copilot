import api, { ANALYTICS_SERVICE_BASE } from './api';

export const getAnalyticsModes = async () => {
    // This could fetch dynamic mode configurations if supported by backend
    // For now returning the expected metadata
    return [
        {
            id: 'standard',
            title: 'Standard Mode',
            description: 'Build and run your own specific models based on your manual configuration.',
            isAutopilot: false
        },
        {
            id: 'autopilot',
            title: 'Autopilot Mode',
            description: 'System-managed ML pipelines. We automatically select algorithms.',
            isAutopilot: true
        }
    ];
};

export const getLiveInsights = async () => {
    try {
        const response = await api.get(`${ANALYTICS_SERVICE_BASE}/api/v1/analytics/insights`);
        return response.data.data || response.data;
    } catch (error) {
        console.error('Error fetching analytics insights:', error);
        throw error;
    }
};

export const getModelPerformance = async (modelId) => {
    try {
        const response = await api.get(`${ANALYTICS_SERVICE_BASE}/api/v1/analytics/performance/${modelId}`);
        return response.data.data || response.data;
    } catch (error) {
        console.error(`Error fetching performance for ${modelId}:`, error);
        throw error;
    }
};

export const listDatasets = async (deviceId) => {
    try {
        const response = await api.get(`${ANALYTICS_SERVICE_BASE}/api/v1/analytics/datasets`, {
            params: { device_id: deviceId }
        });
        return response.data.datasets || [];
    } catch (error) {
        console.error('Error listing datasets:', error);
        return [];
    }
};

export const runAnalyticsJob = async (requestData) => {
    try {
        const response = await api.post(`${ANALYTICS_SERVICE_BASE}/api/v1/analytics/run`, requestData);
        return response.data;
    } catch (error) {
        console.error('Error running analytics job:', error);
        throw error;
    }
};

export const getJobStatus = async (jobId) => {
    try {
        const response = await api.get(`${ANALYTICS_SERVICE_BASE}/api/v1/analytics/status/${jobId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching status for job ${jobId}:`, error);
        throw error;
    }
};

export const getAnalyticsResults = async (jobId) => {
    try {
        const response = await api.get(`${ANALYTICS_SERVICE_BASE}/api/v1/analytics/results/${jobId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching results for job ${jobId}:`, error);
        throw error;
    }
};
