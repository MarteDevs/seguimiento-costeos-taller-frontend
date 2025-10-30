<template>
  <v-app>
    <!-- Navigation Drawer con animaciones -->
    <v-navigation-drawer 
      permanent 
      width="280" 
      class="navigation-drawer"
      elevation="2"
    >
      <!-- Header del sidebar -->
      <v-sheet class="pa-6 sidebar-header" color="primary" variant="flat">
        <router-link to="/" class="text-decoration-none">
          <div class="d-flex align-center">
            <v-icon color="white" size="32" class="mr-3">mdi-chart-timeline-variant</v-icon>
            <div>
              <div class="text-h6 text-white font-weight-bold">Seguimiento</div>
              <div class="text-body-2 text-white opacity-80">y Costeo</div>
            </div>
          </div>
        </router-link>
      </v-sheet>

      <!-- Navigation Menu -->
      <v-list nav density="comfortable" class="navigation-menu">
        <v-list-item 
          to="/" 
          title="Listado de proyectos" 
          link 
          prepend-icon="mdi-view-list" 
          exact
          class="nav-item"
        />
        <v-list-item 
          to="/proyectos/nuevo" 
          title="Crear proyecto" 
          link 
          prepend-icon="mdi-plus-box"
          class="nav-item"
        />
      </v-list>

      <v-divider class="my-4" />

      <!-- Quick Access Section -->
      <div class="px-4 pb-4 quick-access-section">
        <div class="text-medium-emphasis mb-3 d-flex align-center">
          <v-icon size="small" class="mr-2">mdi-lightning-bolt</v-icon>
          Acceso rápido
        </div>
        <v-card variant="outlined" class="quick-access-card">
          <v-card-text class="pa-4">
            <v-text-field 
              v-model="gotoId" 
              label="ID del proyecto" 
              type="number" 
              hide-details 
              density="comfortable" 
              prepend-inner-icon="mdi-pound-box"
              variant="outlined"
              class="mb-3"
            />
            <v-btn 
              block 
              color="primary" 
              @click="goToDetail" 
              prepend-icon="mdi-open-in-new"
              variant="elevated"
              :disabled="!gotoId"
              class="quick-access-btn"
            >
              Abrir detalles
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </v-navigation-drawer>

    <!-- App Bar con gradiente -->
    <v-app-bar 
      color="primary" 
      elevation="0" 
      class="app-bar"
      height="64"
    >
      <v-container class="d-flex align-center">
        <router-link to="/" class="text-white text-decoration-none">
          <div class="d-flex align-center">
            <v-icon color="white" class="mr-2">mdi-home</v-icon>
            <strong class="text-h6">Seguimiento y Costeo</strong>
          </div>
        </router-link>
        
        <v-spacer />
        
        <!-- Breadcrumb dinámico -->
        <div class="breadcrumb-section">
          <v-breadcrumbs 
            :items="breadcrumbItems" 
            class="pa-0"
            color="white"
            divider="/"
          >
            <template #item="{ item }">
              <v-breadcrumbs-item 
                :to="item.to" 
                :disabled="item.disabled"
                class="text-white"
              >
                <v-icon v-if="item.icon" size="small" class="mr-1">{{ item.icon }}</v-icon>
                {{ item.title }}
              </v-breadcrumbs-item>
            </template>
          </v-breadcrumbs>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Main Content con transiciones -->
    <v-main class="main-content">
      <div class="content-wrapper">
        <router-view v-slot="{ Component, route }">
          <transition 
            :name="transitionName" 
            mode="out-in"
          >
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </v-main>

    <!-- Loading overlay global -->
    <v-overlay 
      v-model="isLoading" 
      class="loading-overlay"
      persistent
    >
      <div class="loading-content">
        <v-progress-circular 
          indeterminate 
          size="64" 
          color="primary"
          class="mb-4"
        />
        <div class="text-h6 text-center">Cargando...</div>
      </div>
    </v-overlay>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const gotoId = ref('')
const isLoading = ref(false)
const transitionName = ref('fade')

// Función para navegar a detalles
function goToDetail() { 
  if (gotoId.value) {
    router.push(`/proyectos/${gotoId.value}`)
    gotoId.value = ''
  }
}

// Breadcrumb dinámico basado en la ruta actual
const breadcrumbItems = computed(() => {
  const items = []
  
  if (route.path === '/') {
    items.push({ title: 'Inicio', icon: 'mdi-home', to: '/', disabled: true })
  } else if (route.path === '/proyectos/nuevo') {
    items.push(
      { title: 'Inicio', icon: 'mdi-home', to: '/' },
      { title: 'Crear Proyecto', icon: 'mdi-plus', disabled: true }
    )
  } else if (route.path.startsWith('/proyectos/') && route.params.id) {
    items.push(
      { title: 'Inicio', icon: 'mdi-home', to: '/' },
      { title: `Proyecto ${route.params.id}`, icon: 'mdi-folder', disabled: true }
    )
  }
  
  return items
})

// Determinar tipo de transición basado en la navegación
watch(route, (to, from) => {
  if (!from.path) {
    transitionName.value = 'fade'
    return
  }
  
  // Navegación hacia adelante (más profunda)
  if (to.path.length > from.path.length) {
    transitionName.value = 'slide-left'
  }
  // Navegación hacia atrás (menos profunda)
  else if (to.path.length < from.path.length) {
    transitionName.value = 'slide-right'
  }
  // Navegación lateral (mismo nivel)
  else {
    transitionName.value = 'fade'
  }
})

// Las transiciones se manejan completamente con CSS
</script>

<style scoped>
/* Variables CSS para consistencia */
:root {
  --sidebar-width: 280px;
  --app-bar-height: 64px;
  --transition-duration: 0.3s;
  --border-radius: 12px;
}

/* Navigation Drawer Styles */
.navigation-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.sidebar-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%) !important;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  margin-bottom: 8px;
}

.navigation-menu .nav-item {
  margin: 4px 12px;
  border-radius: var(--border-radius);
  transition: all var(--transition-duration) ease;
}

.navigation-menu .nav-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: translateX(4px);
}

.navigation-menu .nav-item.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

/* Quick Access Section */
.quick-access-section {
  animation: slideInUp 0.6s ease-out 0.3s both;
}

.quick-access-card {
  border-radius: var(--border-radius) !important;
  transition: all var(--transition-duration) ease;
}

.quick-access-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-access-btn {
  border-radius: var(--border-radius) !important;
  transition: all var(--transition-duration) ease;
}

.quick-access-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
}

/* App Bar Styles */
.app-bar {
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.breadcrumb-section {
  animation: slideInRight 0.5s ease-out;
}

/* App Bar */
.app-bar .v-container {
  max-width: none !important;
  width: 100% !important;
}

/* Main Content */
.main-content {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.content-wrapper {
  padding: 24px;
  width: 100%;
}

/* Loading Overlay */
.loading-overlay {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: pulse 2s infinite;
}

/* Transiciones de página */
.fade-enter-active {
  transition: opacity var(--transition-duration) ease, transform var(--transition-duration) ease;
}

.fade-leave-active {
  transition: opacity var(--transition-duration) ease, transform var(--transition-duration) ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-left-enter-active {
  transition: opacity var(--transition-duration) ease, transform var(--transition-duration) ease;
}

.slide-left-leave-active {
  transition: opacity var(--transition-duration) ease, transform var(--transition-duration) ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-active {
  transition: opacity var(--transition-duration) ease, transform var(--transition-duration) ease;
}

.slide-right-leave-active {
  transition: opacity var(--transition-duration) ease, transform var(--transition-duration) ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Animaciones */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Utilidades */
.text-white { 
  color: white !important; 
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }
  
  .breadcrumb-section {
    display: none;
  }
  
  .navigation-drawer {
    width: 260px !important;
  }
}

/* Scrollbar personalizado */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* Mejoras de accesibilidad */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Estados de focus mejorados */
.v-btn:focus-visible,
.v-text-field:focus-within {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>