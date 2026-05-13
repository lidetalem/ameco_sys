import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — auto-refresh on 401 ────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        })
        localStorage.setItem('access_token', data.access)
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login:   (data) => api.post('/auth/login/', data),
  logout:  (refresh) => api.post('/auth/logout/', { refresh }),
  me:      () => api.get('/auth/me/'),
}

// ── Admins ─────────────────────────────────────────────────────────────────
export const adminsAPI = {
  list:   () => api.get('/admins/management/'),
  get:    (id) => api.get(`/admins/management/${id}/`),
  create: (data) => api.post('/admins/management/', data),
  update: (id, data) => api.patch(`/admins/management/${id}/`, data),
  delete: (id) => api.delete(`/admins/management/${id}/`),
}

// ── Guards ─────────────────────────────────────────────────────────────────
export const guardsAPI = {
  list:   () => api.get('/guard/'),
  get:    (id) => api.get(`/guard/${id}/`),
  create: (data) => api.post('/guard/', data),
  update: (id, data) => api.patch(`/guard/${id}/`, data),
  delete: (id) => api.delete(`/guard/${id}/`),
}

// ── Staff ──────────────────────────────────────────────────────────────────
export const staffAPI = {
  list:   () => api.get('/staff/'),
  get:    (id) => api.get(`/staff/${id}/`),
  create: (data) => api.post('/staff/', data),
  update: (id, data) => api.patch(`/staff/${id}/`, data),
  delete: (id) => api.delete(`/staff/${id}/`),
}

// ── Visitors ───────────────────────────────────────────────────────────────
export const visitorsAPI = {
  list:   () => api.get('/temporary-users/profiles/'),
  get:    (id) => api.get(`/temporary-users/profiles/${id}/`),
  create: (data) => api.post('/temporary-users/profiles/', data),
  update: (id, data) => api.patch(`/temporary-users/profiles/${id}/`, data),
  delete: (id) => api.delete(`/temporary-users/profiles/${id}/`),
}

// ── Visitor Requests ───────────────────────────────────────────────────────
export const requestsAPI = {
  list:         () => api.get('/temporary-requests/requests/'),
  create:       (data) => api.post('/temporary-requests/requests/', data),
  updateStatus: (id, data) => api.patch(`/temporary-requests/requests/${id}/update_status/`, data),
}

// ── Cameras ────────────────────────────────────────────────────────────────
export const camerasAPI = {
  list:         () => api.get('/camera/terminals/'),
  get:          (id) => api.get(`/camera/terminals/${id}/`),
  create:       (data) => api.post('/camera/terminals/', data),
  update:       (id, data) => api.patch(`/camera/terminals/${id}/`, data),
  delete:       (id) => api.delete(`/camera/terminals/${id}/`),
  togglePower:  (id) => api.patch(`/camera/terminals/${id}/toggle_power/`),
  toggleStatus: (id) => api.patch(`/camera/terminals/${id}/toggle_status/`),
}

// ── Logs ───────────────────────────────────────────────────────────────────
export const logsAPI = {
  list:      (params) => api.get('/logs/', { params }),
  history:   (params) => api.get('/logs/history/', { params }),
  exportCsv: (params) => api.get('/logs/export_csv/', { params, responseType: 'blob' }),
}

// ── Notifications ──────────────────────────────────────────────────────────
export const notificationsAPI = {
  list:       () => api.get('/notifications/'),
  markRead:   (id) => api.patch(`/notifications/${id}/mark_read/`),
  dismiss:    (id) => api.patch(`/notifications/${id}/dismiss/`),
  markAllRead:() => api.patch('/notifications/mark_all_read/'),
}

// ── Face Recognition ───────────────────────────────────────────────────────
export const recognitionAPI = {
  scan:         (data) => api.post('/recognition/scan/', data),
  reloadCache:  () => api.post('/recognition/reload/'),
}