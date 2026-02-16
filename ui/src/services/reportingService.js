import api, { DATA_EXPORT_SERVICE_BASE } from './api';

export const generateReport = async (payload) => {
    try {
        // Using data-export-service as the backend for report generation/export
        const response = await api.post(`${DATA_EXPORT_SERVICE_BASE}/api/v1/export/generate`, payload);
        return response.data.data || response.data;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
};

export const getExportStatus = async (exportId) => {
    try {
        const response = await api.get(`${DATA_EXPORT_SERVICE_BASE}/api/v1/export/status/${exportId}`);
        return response.data.data || response.data;
    } catch (error) {
        console.error(`Error checking export ${exportId} status:`, error);
        throw error;
    }
};

export const downloadReportFile = async (exportId) => {
    try {
        const response = await api.get(`${DATA_EXPORT_SERVICE_BASE}/api/v1/export/download/${exportId}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error(`Error downloading report ${exportId}:`, error);
        throw error;
    }
};
