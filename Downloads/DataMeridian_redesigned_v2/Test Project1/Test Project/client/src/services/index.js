import api from './api';

export const ANALYTICS_REFRESH_EVENT = 'analytics:refresh';

export function notifyAnalyticsRefresh() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ANALYTICS_REFRESH_EVENT));
}

function analyticsMutation(request) {
  return request.then((response) => {
    notifyAnalyticsRefresh();
    return response.data;
  });
}

export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const datasetService = {
  list: (params) => api.get('/datasets', { params }).then((r) => r.data),
  get: (id) => api.get(`/datasets/${id}`).then((r) => r.data),
  create: (data) => analyticsMutation(api.post('/datasets', data)),
  update: (id, data) => analyticsMutation(api.put(`/datasets/${id}`, data)),
  remove: (id) => analyticsMutation(api.delete(`/datasets/${id}`)),
  archive: (id) => analyticsMutation(api.post(`/datasets/${id}/archive`)),
  restore: (id) => analyticsMutation(api.post(`/datasets/${id}/restore`)),
  retire: (id, reason) => analyticsMutation(api.post(`/datasets/${id}/retire`, { reason })),
  share: (id, data) => api.post(`/datasets/${id}/share`, data).then((r) => r.data),
  citations: (id) => api.get(`/datasets/${id}/citations`).then((r) => r.data),

  uploadVersion: (id, formData, onProgress) =>
    analyticsMutation(api
      .post(`/datasets/${id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (onProgress) onProgress(Math.round((evt.loaded * 100) / (evt.total || 1)));
        },
      })),
  listVersions: (id) => api.get(`/datasets/${id}/versions`).then((r) => r.data),
  downloadFile: (id, storedName) => api.get(`/datasets/${id}/files/${encodeURIComponent(storedName)}`, { responseType: 'blob' }),

  updateMetadata: (id, data) => api.put(`/datasets/${id}/metadata`, data).then((r) => r.data),
  metadataCompleteness: (id) => api.get(`/datasets/${id}/metadata/completeness`).then((r) => r.data),

  validate: (id) => api.post(`/datasets/${id}/validate`).then((r) => r.data),
  latestValidation: (id) => api.get(`/datasets/${id}/validation`).then((r) => r.data),
  validationHistory: (id) => api.get(`/datasets/${id}/validation/history`).then((r) => r.data),

  collaborators: (id) => api.get(`/datasets/${id}/collaborators`).then((r) => r.data),
  addCollaborator: (id, data) => api.post(`/datasets/${id}/collaborators`, data).then((r) => r.data),
  updateCollaborator: (id, collabId, data) =>
    api.put(`/datasets/${id}/collaborators/${collabId}`, data).then((r) => r.data),
  removeCollaborator: (id, collabId) =>
    api.delete(`/datasets/${id}/collaborators/${collabId}`).then((r) => r.data),
  activity: (id) => api.get(`/datasets/${id}/activity`).then((r) => r.data),
};

export const duplicateService = {
  list: () => api.get('/duplicates').then((r) => r.data),
  scan: () => analyticsMutation(api.post('/duplicates/scan')),
  resolve: (id, status, relationship = {}) =>
    analyticsMutation(api.post(`/duplicates/${id}/resolve`, { status, ...relationship })),
};

export const analyticsService = {
  dashboard: () => api.get('/analytics/dashboard').then((r) => r.data),
  storage: () => api.get('/analytics/storage').then((r) => r.data),
  storageUsers: () => api.get('/analytics/storage/users').then((r) => r.data),
  storageUser: (userId) => api.get(`/analytics/storage/users/${userId}`).then((r) => r.data),
};

export const aiService = {
  status: () => api.get('/ai/status').then((r) => r.data),
  classify: (data) => api.post('/ai/classify', data).then((r) => r.data),
  generateMetadata: (data) => api.post('/ai/generate-metadata', data).then((r) => r.data),
  metadataQuality: (id) => api.post(`/ai/metadata-quality/${id}`).then((r) => r.data),
  detectDuplicates: () => api.post('/ai/detect-duplicates').then((r) => r.data),
};

export const notificationService = {
  list: () => api.get('/notifications').then((r) => r.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => api.put('/notifications/read-all').then((r) => r.data),
};

export const searchService = {
  global: (q) => api.get('/search', { params: { q } }).then((r) => r.data),
};

export const userService = {
  list: () => api.get('/users').then((r) => r.data),
  search: (query) => api.get('/users/search', { params: { q: query } }).then((r) => r.data),
  updateMe: (data) => api.put('/users/me', data).then((r) => r.data),
};
