import { createRouter, createWebHistory } from 'vue-router';

const ProyectosList = () => import('../views/ProyectosList.vue');
const ProyectoDetalle = () => import('../views/ProyectoDetalle.vue');
const SeguimientoProyecto = () => import('../views/seguimiento/SeguimientoProyecto.vue');

const routes = [
  { path: '/', name: 'home', component: ProyectosList },
  { path: '/proyectos/:id', name: 'proyecto-detalle', component: ProyectoDetalle, props: true },
  { path: '/proyectos/:id/seguimiento', name: 'proyecto-seguimiento', component: SeguimientoProyecto, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;