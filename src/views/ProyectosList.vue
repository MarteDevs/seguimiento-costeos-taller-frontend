<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ProyectosService } from '../services/proyectosService'

const router = useRouter()
const proyectos = ref([])
const loading = ref(false)
const error = ref('')
const toast = ref({ show: false, message: '', color: 'success' })
function notify(message, color = 'success') {
  toast.value = { show: true, message, color }
}

async function cargarProyectos() {
  loading.value = true
  error.value = ''
  try {
    const res = await ProyectosService.list()
    const d = res?.data
    let list = []
    if (Array.isArray(d)) {
      list = d
    } else if (Array.isArray(d?.proyectos)) {
      list = d.proyectos
    } else if (Array.isArray(res)) {
      list = res
    }
    proyectos.value = list
    await cargarEstados()
  } catch (e) {
    error.value = e.message
    notify(e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function eliminarProyecto(id) {
  error.value = ''
  try {
    await ProyectosService.delete(id)
    await cargarProyectos()
    notify('Proyecto eliminado', 'success')
  } catch (e) { 
    error.value = e.message
    notify(e.message, 'error')
  }
}

onMounted(cargarProyectos)

// Estado por proyecto según resumen
const estados = ref({})

function hasPositiveNumber(obj) {
  if (!obj || typeof obj !== 'object') return false
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (typeof v === 'number' && isFinite(v) && v > 0) return true
    if (v && typeof v === 'object' && hasPositiveNumber(v)) return true
  }
  return false
}

async function cargarEstadoProyecto(pid) {
  estados.value[pid] = { loading: true, label: 'Cargando', color: 'grey' }
  try {
    const r = await ProyectosService.resumen(pid)
    const data = r.data ?? r
    const ok = hasPositiveNumber(data)
    estados.value[pid] = { loading: false, label: ok ? 'Con costos' : 'Pendiente', color: ok ? 'success' : 'warning' }
  } catch (e) {
    estados.value[pid] = { loading: false, label: 'Sin resumen', color: 'warning' }
  }
}

async function cargarEstados() {
  await Promise.all((proyectos.value || []).map(p => cargarEstadoProyecto(p.id)))
}

function statusLabel(id) { return estados.value[id]?.label || 'Pendiente' }
function statusColor(id) { return estados.value[id]?.color || 'warning' }
</script>

<template>
  <div class="proyectos-container">
    <!-- Header con animación de entrada -->
    <div class="header-section">
      <div class="text-h3 font-weight-light mb-2">Proyectos</div>
      <div class="text-subtitle-1 text-medium-emphasis">Gestiona y supervisa todos tus proyectos</div>
    </div>

    <!-- Loading state elegante -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="48" />
      <div class="text-subtitle-1 mt-4 text-medium-emphasis">Cargando proyectos...</div>
    </div>

    <!-- Error state -->
    <v-alert v-if="error && !loading" type="error" variant="tonal" class="mb-6">
      <template #prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      {{ error }}
    </v-alert>

    <!-- Grid de proyectos con animaciones -->
    <div v-if="!loading" class="proyectos-grid">
      <transition-group name="card-list" tag="div" class="grid-container">
        <v-card
          v-for="(proyecto, index) in proyectos"
          :key="proyecto.id"
          class="proyecto-card"
          :style="{ animationDelay: `${index * 100}ms` }"
          elevation="2"
          hover
          @click="$router.push(`/proyectos/${proyecto.id}`)"
        >
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-4">
              <v-avatar color="primary" class="mr-3">
                <v-icon color="white">mdi-folder-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-medium">{{ proyecto.nombre_del_proyecto }}</div>
                <div class="text-caption text-medium-emphasis">ID: {{ proyecto.id }}</div>
              </div>
              <v-chip :color="statusColor(proyecto.id)" variant="tonal" size="small">
                {{ statusLabel(proyecto.id) }}
              </v-chip>
            </div>

            <div class="proyecto-details">
              <div class="detail-item">
                <v-icon size="small" class="mr-2 text-medium-emphasis">mdi-map-marker</v-icon>
                <span class="text-body-2">{{ proyecto.mina }}</span>
              </div>
              <div class="detail-item">
                <v-icon size="small" class="mr-2 text-medium-emphasis">mdi-calendar</v-icon>
                <span class="text-body-2">{{ proyecto.fecha }}</span>
              </div>
              <div class="detail-item">
                <v-icon size="small" class="mr-2 text-medium-emphasis">mdi-tools</v-icon>
                <span class="text-body-2">{{ proyecto.equipo }}</span>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="px-6 pb-4">
            <v-btn variant="text" color="primary" @click.stop="$router.push(`/proyectos/${proyecto.id}`)">
              <v-icon start>mdi-eye</v-icon>
              Ver detalles
            </v-btn>
            <v-spacer />
            <v-btn 
              variant="text" 
              color="error" 
              @click.stop="eliminarProyecto(proyecto.id)"
              :loading="loading"
            >
              <v-icon start>mdi-delete</v-icon>
              Eliminar
            </v-btn>
          </v-card-actions>
        </v-card>
      </transition-group>

      <!-- Estado vacío elegante -->
      <div v-if="proyectos.length === 0" class="empty-state">
        <v-icon size="80" color="grey-lighten-2">mdi-folder-plus-outline</v-icon>
        <div class="text-h6 mt-4 mb-2">No hay proyectos</div>
        <div class="text-body-2 text-medium-emphasis mb-6">Comienza creando tu primer proyecto</div>
        <v-btn color="primary" variant="elevated" @click="$router.push('/proyectos/nuevo')">
          <v-icon start>mdi-plus</v-icon>
          Crear proyecto
        </v-btn>
      </div>
    </div>

    <!-- FAB para crear proyecto -->
    <v-fab
      location="bottom end"
      color="primary"
      icon="mdi-plus"
      @click="$router.push('/proyectos/nuevo')"
      class="fab-create"
    />

    <!-- Toast notifications -->
    <v-snackbar 
      v-model="toast.show" 
      :color="toast.color" 
      timeout="3000" 
      location="top"
      variant="elevated"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">
          {{ toast.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        {{ toast.message }}
      </div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.proyectos-container {
  padding: 0;
  width: 100%;
}

.header-section {
  text-align: center;
  margin-bottom: 32px;
  padding: 0 24px;
  animation: fadeInUp 0.6s ease-out;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  animation: fadeIn 0.4s ease-out;
}

.proyectos-grid {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 80px;
  padding: 0 8px;
}

.proyecto-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.5s ease-out both;
  border-radius: 12px !important;
}

.proyecto-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.proyecto-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  animation: fadeIn 0.6s ease-out;
}

.fab-create {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  animation: bounceIn 0.6s ease-out 0.8s both;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Transiciones para la lista */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.5s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.card-list-move {
  transition: transform 0.5s ease;
}
</style>