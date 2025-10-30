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

const form = ref({
  fecha: '',
  nombre_del_proyecto: '',
  mina: '',
  equipo: '',
  habilitado_estimado: '',
  dias_trabajados: '',
  numeros_de_trabajadores_por_dia: '',
  numero_de_tareas_por_dia: ''
})

async function cargarProyectos() {
  loading.value = true
  error.value = ''
  try {
    const res = await ProyectosService.list()
    // Adaptar a distintas formas de respuesta del backend
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

function toNumber(v) { return v === '' || v === null ? null : Number(v) }

async function crearProyecto() {
  error.value = ''
  try {
    const payload = {
      fecha: form.value.fecha,
      nombre_del_proyecto: form.value.nombre_del_proyecto,
      mina: form.value.mina,
      equipo: form.value.equipo,
      habilitado_estimado: toNumber(form.value.habilitado_estimado),
      "días_trabajados": toNumber(form.value.dias_trabajados),
      "números_de_trabajadores_por_dia": toNumber(form.value.numeros_de_trabajadores_por_dia),
      numero_de_tareas_por_dia: toNumber(form.value.numero_de_tareas_por_dia),
    }
    const res = await ProyectosService.create(payload)
    await cargarProyectos()
    const id = res?.data?.id
    notify('Proyecto creado correctamente', 'success')
    if (id) router.push(`/proyectos/${id}`)
  } catch (e) {
    error.value = e.message
    notify(e.message, 'error')
  }
}

async function eliminarProyecto(id) {
  error.value = ''
  try {
    await ProyectosService.delete(id)
    await cargarProyectos()
    notify('Proyecto eliminado', 'success')
  } catch (e) { error.value = e.message }
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
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="mb-1">Proyectos</h1>
        <div class="text-medium-emphasis mb-4">Crea, lista y elimina proyectos.</div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Crear proyecto</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="crearProyecto">
              <v-text-field label="Fecha" type="date" v-model="form.fecha" required density="comfortable" />
              <v-text-field label="Nombre del proyecto" v-model="form.nombre_del_proyecto" required />
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field label="Mina" v-model="form.mina" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Equipo" v-model="form.equipo" required />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field label="Habilitado estimado" type="number" step="0.01" v-model="form.habilitado_estimado" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Días trabajados" type="number" v-model="form.dias_trabajados" required />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field label="Números de trabajadores por día" type="number" v-model="form.numeros_de_trabajadores_por_dia" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Número de tareas por día" type="number" v-model="form.numero_de_tareas_por_dia" required />
                </v-col>
              </v-row>
              <div class="d-flex align-center gap-2">
                <v-btn type="submit" color="primary">Crear</v-btn>
                <v-progress-circular v-if="loading" size="20" indeterminate color="primary" />
              </div>
              <v-alert v-if="error" type="error" class="mt-3" density="compact">{{ error }}</v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Lista de proyectos</v-card-title>
          <v-card-text>
            <div v-if="loading" class="py-2">
              <v-progress-linear indeterminate color="primary" />
            </div>
            <div v-else>
              <div v-if="(proyectos?.length || 0) === 0" class="text-medium-emphasis">No hay proyectos.</div>
              <v-list v-else lines="two">
                <v-list-item v-for="p in proyectos" :key="p.id" :to="`/proyectos/${p.id}`" link>
                  <v-list-item-title>
                    <span class="font-weight-medium">{{ p.nombre_del_proyecto }}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle>Mina: {{ p.mina }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="statusColor(p.id)" variant="tonal" class="mr-2">{{ statusLabel(p.id) }}</v-chip>
                    <v-btn color="error" variant="tonal" @click.stop="eliminarProyecto(p.id)">Eliminar</v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-snackbar v-model="toast.show" :color="toast.color" timeout="2500" location="top">{{ toast.message }}</v-snackbar>
</template>

<style scoped>
.gap-2 { gap: 0.5rem; }
</style>