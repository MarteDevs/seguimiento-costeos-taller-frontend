import { http } from './httpClient';

export const ProyectosService = {
  create: (data) => http.post('/api/proyectos', data),
  list: () => http.get('/api/proyectos'),
  get: (id) => http.get(`/api/proyectos/${id}`),
  actualizarResumen: (id) => http.post(`/api/proyectos/${id}/actualizar-resumen`, {}),
  resumen: (id) => http.get(`/api/proyectos/${id}/resumen`),
  delete: (id) => http.delete(`/api/proyectos/${id}`),
};