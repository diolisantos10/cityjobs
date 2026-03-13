import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Packages ──────────────────────────────────────────────────────────────
export const getPackages = () => api.get('/api/packages').then(r => r.data.packages);

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const submitJob = (payload) => api.post('/api/jobs', payload).then(r => r.data);
export const getJob = (id) => api.get(`/api/jobs/${id}`).then(r => r.data.job);
export const getJobPublications = (jobId) =>
  api.get(`/api/publications/job/${jobId}`).then(r => r.data.publications);

// ─── Payments ──────────────────────────────────────────────────────────────
export const createCheckout = ({ job_id, package_id }) =>
  api.post('/api/payments/checkout', { job_id, package_id }).then(r => r.data);
export const getPaymentStatus = (sessionId) =>
  api.get(`/api/payments/status/${sessionId}`).then(r => r.data);

// ─── Admin ──────────────────────────────────────────────────────────────────
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': import.meta.env.VITE_ADMIN_KEY || '',
  },
});

export const adminGetJobs = (params) => adminApi.get('/api/jobs', { params }).then(r => r.data.jobs);
export const adminApproveJob = (id, data) => adminApi.patch(`/api/jobs/${id}/approve`, data).then(r => r.data);
export const adminRejectJob = (id, data) => adminApi.patch(`/api/jobs/${id}/reject`, data).then(r => r.data);
export const adminGetSchedule = (date) =>
  adminApi.get('/api/publications/schedule', { params: { date } }).then(r => r.data);
export const adminGetManualQueue = () =>
  adminApi.get('/api/publications/pending-manual').then(r => r.data.publications);
export const adminMarkPublished = (id, data) =>
  adminApi.patch(`/api/publications/${id}/mark-published`, data).then(r => r.data);
