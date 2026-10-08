import axios from 'axios'

// const api = axios.create({ baseURL: '/api' })
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`
})


// Tự gắn JWT vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('toeic_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token hết hạn → tự logout
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('toeic_token')
      localStorage.removeItem('toeic_user')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export const agentAPI = {
  // Auth
  register: (email, password, full_name) =>
    api.post('/auth/register', { email, password, full_name }).then(r => r.data),
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/me').then(r => r.data),

  // Agent
  analyze:       (stats)                => api.post('/agent/analyze', { stats }).then(r => r.data),
  
  // 👇 API MỚI THÊM VÀO ĐÂY NHÉ 👇
  generate:      (stats, mode)          => api.post('/agent/generate', { stats, mode }).then(r => r.data),
  sessionResult: (mode, total, correct) => api.post('/agent/session-result', { mode, total, correct }).then(r => r.data),

  // Chat
  chat: (question, history) => api.post('/chat', { question, history }).then(r => r.data.text),
  // chat: (question, history) => api.post('/chat', { 
  //   question: question, 
  //   history: history || [] 
  // }).then(r => r.data.text),

  // Vocab
  generatePoem: (word) => api.post('/vocab/poem', { word }).then(r => r.data),
  vocabHistory: ()     => api.get('/vocab/history').then(r => r.data.history),

  // Stats
  upsertStats: (mode, done, correct) =>
    api.post('/stats/upsert', { mode, done, correct }).catch(() => {}),

  // Sessions
  getSessions: () => api.get('/sessions').then(r => r.data.sessions),

  generateFlashcards: (file) => {
    const formData = new FormData()
    formData.append("file", file)
    return api.post('/flashcards/generate-from-image', formData).then(r => r.data)
  },
  
  saveFlashcards: (deckData) => 
    api.post('/flashcards/save', deckData).then(r => r.data),

  getSavedFlashcards: (current_user_id) => 
  api.get(`/flashcards?current_user_id=${current_user_id}`).then(r => r.data),
  getVocabHistory: (current_user_id) => 
  api.get(`/vocab/history?current_user_id=${current_user_id}`).then(r => r.data),
}



