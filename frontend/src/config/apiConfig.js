// Configuración centralizada de la API
const isDevelopment = import.meta.env.DEV;

export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? 'http://localhost:8000'  // Para desarrollo local
    : 'https://gestion-maquinaria-backend.herokuapp.com',  // Para producción
  API_URL: isDevelopment 
    ? 'http://localhost:8000/api'  // Para desarrollo local
    : 'https://gestion-maquinaria-backend.herokuapp.com/api'  // Para producción
};

export default API_CONFIG;
