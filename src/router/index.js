import { createRouter, createWebHistory } from 'vue-router';

const ProyectosList = () => import('../views/ProyectosList.vue');
const ProyectoDetalle = () => import('../views/ProyectoDetalle.vue');

const routes = [
  { path: '/', name: 'home', component: ProyectosList },
  { path: '/proyectos/:id', name: 'proyecto-detalle', component: ProyectoDetalle, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;