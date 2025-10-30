import { http, BASE_URL } from './httpClient'

export const SeguimientoService = {
  tareas: {
    list: (proyectoId) => http.get(`/api/proyectos/${proyectoId}/seguimiento/tareas`),
    create: (proyectoId, data) => http.post(`/api/proyectos/${proyectoId}/seguimiento/tareas`, data),
    update: (proyectoId, tareaId, data) => http.put(`/api/proyectos/${proyectoId}/seguimiento/tareas/${tareaId}`, data),
    delete: (proyectoId, tareaId) => http.delete(`/api/proyectos/${proyectoId}/seguimiento/tareas/${tareaId}`),
  },
  materiales: {
    listLogs: (proyectoId) => http.get(`/api/proyectos/${proyectoId}/seguimiento/materiales`),
    getLogsByMaterial: (proyectoId, materialId) => http.get(`/api/proyectos/${proyectoId}/seguimiento/materiales/${materialId}`),
    registrarUso: async (proyectoId, materialId, data) => {
      try {
        // Ruta según especificación
        return await http.post(`/api/proyectos/${proyectoId}/seguimiento/materiales/${materialId}/uso`, data)
      } catch (e) {
        const msg = e?.message || ''
        // Fallback: algunos backends usan una ruta sin materialId y esperan material_id en el body
        if (msg.includes('Ruta no encontrada') || msg.includes('HTTP 404')) {
          const body = { ...data, material_id: materialId }
          return await http.post(`/api/proyectos/${proyectoId}/seguimiento/materiales/uso`, body)
        }
        throw e
      }
    },
  },
  avance: (proyectoId) => http.get(`/api/proyectos/${proyectoId}/seguimiento/avance`),
  //manifiestoUrl: (proyectoId) => `${BASE_URL}/api/proyectos/${proyectoId}/seguimiento/manifiesto.pdf`,
  manifiestoUrl: (proyectoId) => `${BASE_URL}/api/proyectos/${proyectoId}/seguimiento/manifiesto.xlsx`,
}

export default SeguimientoService