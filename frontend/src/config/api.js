// Configuración centralizada de la API
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
};

export default API_CONFIG;
