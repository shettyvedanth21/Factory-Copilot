import axios from 'axios';

// Base URLs for microservices
// In development, these are usually proxied through Vite.
// In production, they might be absolute URLs or handled by an ingress/load balancer.
export const DEVICE_SERVICE_BASE = "/backend/device";
export const DATA_SERVICE_BASE = "/backend/data";
export const RULE_ENGINE_SERVICE_BASE = "/backend/rule-engine";
export const ANALYTICS_SERVICE_BASE = "/backend/analytics";
export const DATA_EXPORT_SERVICE_BASE = "/backend/data-export";
export const REPORTING_SERVICE_BASE = "/backend/reporting";

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
