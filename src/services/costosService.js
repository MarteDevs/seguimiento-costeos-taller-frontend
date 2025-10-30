import { http } from './httpClient';

const endpoints = {
  'mano-obra': '/costos/mano-obra',
  'local': '/costos/local',
  'vigilancia': '/costos/vigilancia',
  'energia': '/costos/energia',
  'herramientas-otros': '/costos/herramientas-otros',
  'materiales': '/costos/materiales',
  'implementos-seguridad': '/costos/implementos-seguridad',
  'petroleo': '/costos/petroleo',
  'gasolina': '/costos/gasolina',
  'topico': '/costos/topico',
  'equipo-otro': '/costos/equipo-otro',
};

export function crearCosto(proyectoId, categoria, payload) {
  const ep = endpoints[categoria];
  if (!ep) throw new Error(`Categoría no soportada: ${categoria}`);
  return http.post(`/api/proyectos/${proyectoId}${ep}`, payload);
}

export function actualizarCosto(proyectoId, categoria, id, payload) {
  const ep = endpoints[categoria];
  if (!ep) throw new Error(`Categoría no soportada: ${categoria}`);
  return http.put(`/api/proyectos/${proyectoId}${ep}/${id}`, payload);
}

export function eliminarCosto(proyectoId, categoria, id) {
  const ep = endpoints[categoria];
  if (!ep) throw new Error(`Categoría no soportada: ${categoria}`);
  return http.delete(`/api/proyectos/${proyectoId}${ep}/${id}`);
}

export const CategoriasCostos = Object.keys(endpoints);