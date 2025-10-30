<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ProyectosService } from '../services/proyectosService'
import { crearCosto, actualizarCosto, eliminarCosto, CategoriasCostos } from '../services/costosService'
 

const route = useRoute()
const id = route.params.id

const proyecto = ref(null)
const resumen = ref(null)
const loading = ref(false)
const error = ref('')
const toast = ref({ show: false, message: '', color: 'success' })
function notify(message, color = 'success') {
  toast.value = { show: true, message, color }
}

async function cargar() {
  loading.value = true
  error.value = ''
  try {
    const [p, r] = await Promise.all([
      ProyectosService.get(id),
      ProyectosService.resumen(id)
    ])
    const pd = p?.data ?? p
    let proj
    if (pd && typeof pd === 'object') {
      if (Array.isArray(pd)) {
        proj = pd[0] ?? null
      } else if (pd?.data && typeof pd.data === 'object' && !Array.isArray(pd.data)) {
        proj = pd.data
      } else if (pd?.proyecto && typeof pd.proyecto === 'object') {
        proj = pd.proyecto
      } else {
        proj = pd
      }
    }
    proyecto.value = proj ?? null
    const rd = r?.data ?? r
    resumen.value = rd?.data && typeof rd.data === 'object' ? rd.data : rd
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function actualizarResumen() {
  try {
    await ProyectosService.actualizarResumen(id)
    await cargar()
    notify('Resumen actualizado', 'success')
  } catch (e) { error.value = e.message; notify(e.message, 'error') }
}

// Utilidades de UI
function fmtDate(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: '2-digit' })
  } catch { return String(v) }
}
function fmtCurrency(v) {
  if (v == null) return '—'
  const str = typeof v === 'string' ? v : null
  const num = typeof v === 'string' ? Number(v) : v
  if (Number.isNaN(num)) return String(v)
  // Respeta los decimales enviados por el backend si vienen como string (ej. "0.0010")
  let min = 2, max = 2
  if (str && str.includes('.')) {
    const decs = str.split('.')[1].length
    min = decs
    max = decs
  } else if (Math.abs(num) < 1) {
    // Para valores pequeños, muestra más precisión
    min = 4
    max = 6
  }
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num)
}

function fmtPercent(v, digits = 0) {
  const n = typeof v === 'string' ? Number(v) : v
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toFixed(digits)}%`
}

// Mapeo de claves del resumen a categorías del servicio
const resumenKeyToCategoria = {
  'mano_de_obra': 'mano-obra',
  'local': 'local',
  'vigilancia': 'vigilancia',
  'energia': 'energia',
  'herramientos_otros': 'herramientas-otros',
  'materiales': 'materiales',
  'implementos_seguridad': 'implementos-seguridad',
  'petroleo': 'petroleo',
  'gasolina': 'gasolina',
  'topico': 'topico',
  'equipo_otro': 'equipo-otro',
}

function displayLabelForKey(k) {
  const map = {
    'mano_de_obra': 'Mano de obra',
    'local': 'Local',
    'vigilancia': 'Vigilancia',
    'energia': 'Energía',
    'herramientos_otros': 'Herramientas y otros',
    'materiales': 'Materiales',
    'implementos_seguridad': 'Implementos de seguridad',
    'petroleo': 'Petróleo',
    'gasolina': 'Gasolina',
    'topico': 'Tópico',
    'equipo_otro': 'Equipo u otros',
  }
  return map[k] || k
}

function getIconForCategory(k) {
  const iconMap = {
    'mano_de_obra': 'mdi-account-hard-hat',
    'local': 'mdi-home-city',
    'vigilancia': 'mdi-shield-account',
    'energia': 'mdi-lightning-bolt',
    'herramientos_otros': 'mdi-tools',
    'materiales': 'mdi-package-variant',
    'implementos_seguridad': 'mdi-safety-goggles',
    'petroleo': 'mdi-oil',
    'gasolina': 'mdi-gas-station',
    'topico': 'mdi-medical-bag',
    'equipo_otro': 'mdi-cog',
  }
  return iconMap[k] || 'mdi-folder'
}

// Diálogos para crear/editar
const createDialog = ref(false)
const editDialog = ref(false)
const updateDialog = ref(false)
const deleteDialog = ref(false)

function startCreateForKey(k) {
  const cat = resumenKeyToCategoria[k]
  if (!cat) return
  category.value = cat
  resetPayloadWithDefaults()
  createDialog.value = true
}

function startEditForKey(k, row) {
  const cat = resumenKeyToCategoria[k]
  if (!cat) return
  category.value = cat
  update.value.id = row.id
  const allowed = (fieldsByCategory[cat] || []).map(f => f.key)
  const body = {}
  Object.keys(row).forEach(key => {
    if (allowed.includes(key)) body[key] = row[key]
  })
  update.value.body = body
  editDialog.value = true
}

async function deleteRowForKey(k, row) {
  const cat = resumenKeyToCategoria[k]
  if (!cat) return
  try {
    await eliminarCosto(id, cat, row.id)
    await actualizarResumen()
  } catch (e) { error.value = e.message }
}

const category = ref('mano-obra')
const payload = ref({})

const fieldsByCategory = {
  'mano-obra': [
    { key: 'trabajador', label: 'Trabajador', type: 'text', icon: 'mdi-account' },
    { key: 'cantidad_trabajador', label: 'Cantidad de trabajador', type: 'number', icon: 'mdi-counter' },
    { key: 'precio', label: 'Precio', type: 'number', step: '0.01', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'local': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'promedio', label: 'Promedio', type: 'number', icon: 'mdi-chart-line' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'vigilancia': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'promedio', label: 'Promedio', type: 'number', icon: 'mdi-chart-line' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'energia': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'promedio', label: 'Promedio', type: 'number', icon: 'mdi-chart-line' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'herramientas-otros': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'promedio', label: 'Promedio', type: 'number', icon: 'mdi-chart-line' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'materiales': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', icon: 'mdi-counter' },
    { key: 'unidad', label: 'Unidad', type: 'text', icon: 'mdi-ruler' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'cantidad_usado', label: 'Cantidad usado', type: 'number', icon: 'mdi-counter' },
  ],
  'implementos-seguridad': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', icon: 'mdi-counter' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'petroleo': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', icon: 'mdi-counter' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'gasolina': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', icon: 'mdi-counter' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'topico': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', icon: 'mdi-counter' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
  'equipo-otro': [
    { key: 'descripcion', label: 'Descripción', type: 'text', icon: 'mdi-text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', icon: 'mdi-counter' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001', icon: 'mdi-currency-usd' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number', icon: 'mdi-calendar-clock' },
  ],
}

function resetPayload() {
  payload.value = {}
}

function resetPayloadWithDefaults() {
  resetPayload()
  const fields = fieldsByCategory[category.value] || []
  const diasProj = proyecto.value?.['días_trabajados'] ?? proyecto.value?.dias_trabajados ?? null
  for (const f of fields) {
    if (f.key === 'dias_trabajados' && diasProj != null) {
      payload.value['dias_trabajados'] = Number(diasProj)
    }
  }
}

async function enviarCosto() {
  error.value = ''
  try {
    const body = { ...payload.value }
    // convierte numéricos preservando precisión decimal
    Object.keys(body).forEach(k => {
      const field = fieldsByCategory[category.value].find(f => f.key === k)
      if (field && field.type === 'number' && body[k] !== '' && body[k] !== null) {
        body[k] = parseFloat(body[k])
      }
    })
    const res = await crearCosto(id, category.value, body)
    if (!createdIds.value[category.value]) createdIds.value[category.value] = []
    const newId = res?.data?.costo?.id ?? res?.data?.id ?? res?.id
    if (newId) createdIds.value[category.value].push(newId)
    await actualizarResumen()
    resetPayload()
    createDialog.value = false
    notify(res?.message || 'Costo creado exitosamente', 'success')
  } catch (e) { error.value = e.message; notify(e.message, 'error') }
}

const update = ref({ id: '', body: {} })

async function actualizarCostoSubmit() {
  error.value = ''
  try {
    const body = { ...update.value.body }
    Object.keys(body).forEach(k => {
      const field = fieldsByCategory[category.value].find(f => f.key === k)
      if (field && field.type === 'number' && body[k] !== '' && body[k] !== null) {
        body[k] = parseFloat(body[k])
      }
    })
    await actualizarCosto(id, category.value, update.value.id, body)
    await actualizarResumen()
    update.value = { id: '', body: {} }
    notify('Costo actualizado correctamente', 'success')
  } catch (e) { error.value = e.message; notify(e.message, 'error') }
}

const del = ref({ id: '' })
async function eliminarCostoSubmit() {
  error.value = ''
  try {
    await eliminarCosto(id, category.value, del.value.id)
    await actualizarResumen()
    del.value.id = ''
    notify('Costo eliminado correctamente', 'success')
  } catch (e) { error.value = e.message }
}

const createdIds = ref({})

onMounted(cargar)

watch(category, () => resetPayloadWithDefaults())

// Cálculo de categorías con datos y pendientes según el resumen
const categoriesWithRows = computed(() => {
  const data = resumen.value || {}
  return Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length > 0)
})
const categoriesEmpty = computed(() => {
  const data = resumen.value || {}
  return Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length === 0)
})

 
</script>

<template>
  <div class="proyecto-detalle-container">
    <!-- Header con navegación -->
    <div class="header-section">
      <v-btn 
        variant="text" 
        color="primary" 
        @click="$router.back()"
        class="back-button"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>
      
      <div class="project-header">
        <div class="text-h4 font-weight-light mb-2">
          <v-icon color="primary" class="mr-3">mdi-folder-open</v-icon>
          {{ proyecto?.nombre_del_proyecto || 'Cargando...' }}
        </div>
        <div class="text-subtitle-1 text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-identifier</v-icon>
          ID: {{ id }}
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <v-progress-linear 
      v-if="loading" 
      indeterminate 
      color="primary" 
      class="mb-4"
    />

    <!-- Error alert -->
    <v-alert 
      v-if="error" 
      type="error" 
      variant="tonal" 
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      <template #prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      {{ error }}
    </v-alert>

    <!-- Información del proyecto -->
    <v-card v-if="proyecto" class="project-info-card mb-6" elevation="2">
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4 d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>
          Información del proyecto
        </div>
        
        <v-row>
          <v-col cols="12" md="4">
            <div class="info-item">
              <v-icon color="primary" size="small" class="mr-2">mdi-calendar</v-icon>
              <span class="label">Fecha:</span>
              <span class="value">{{ fmtDate(proyecto.fecha) }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-item">
              <v-icon color="primary" size="small" class="mr-2">mdi-map-marker</v-icon>
              <span class="label">Mina:</span>
              <span class="value">{{ proyecto.mina }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-item">
              <v-icon color="primary" size="small" class="mr-2">mdi-tools</v-icon>
              <span class="label">Equipo:</span>
              <span class="value">{{ proyecto.equipo }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-item">
              <v-icon color="primary" size="small" class="mr-2">mdi-currency-usd</v-icon>
              <span class="label">Habilitado estimado:</span>
              <span class="value">{{ fmtCurrency(proyecto.habilitado_estimado ?? proyecto['habilitado_estimado']) }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-item">
              <v-icon color="primary" size="small" class="mr-2">mdi-calendar-clock</v-icon>
              <span class="label">Días trabajados:</span>
              <span class="value">{{ proyecto['días_trabajados'] ?? proyecto['dias_trabajados'] ?? proyecto.dias_trabajados }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-item">
              <v-icon color="primary" size="small" class="mr-2">mdi-account-group</v-icon>
              <span class="label">Trabajadores por día:</span>
              <span class="value">{{ proyecto['números_de_trabajadores_por_dia'] ?? proyecto['numeros_de_trabajadores_por_dia'] ?? proyecto.numeros_de_trabajadores_por_dia }}</span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Botones de acción -->
    <div class="action-buttons-section mb-6">
      <v-btn 
        variant="elevated" 
        color="primary" 
        @click="$router.push(`/proyectos/${id}/seguimiento`)"
        class="mr-3"
      >
        <v-icon start>mdi-chart-timeline-variant</v-icon>
        Seguimiento
      </v-btn>
      <v-btn 
        variant="outlined" 
        color="primary" 
        @click="updateDialog = true"
        class="mr-3"
      >
        <v-icon start>mdi-pencil</v-icon>
        Actualizar costo
      </v-btn>
      <v-btn 
        variant="outlined" 
        color="error" 
        @click="deleteDialog = true"
      >
        <v-icon start>mdi-delete</v-icon>
        Eliminar costo
      </v-btn>
    </div>

    <v-row>
      <!-- Resumen financiero -->
      <v-col cols="12" lg="8">
        <v-card class="summary-card" elevation="2">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-chart-pie</v-icon>
              Resumen financiero
            </div>
            <v-btn 
              color="primary" 
              variant="elevated"
              @click="actualizarResumen"
              size="small"
            >
              <v-icon start>mdi-refresh</v-icon>
              Actualizar
            </v-btn>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <div v-if="resumen?.resumen">
              <v-row>
                <v-col cols="12" md="6" lg="4" v-for="(item, key) in {
                  costo_fijo: { label: 'Costo fijo', icon: 'mdi-lock', color: 'blue' },
                  costo_variable: { label: 'Costo variable', icon: 'mdi-chart-line-variant', color: 'orange' },
                  costo_directo: { label: 'Costo directo', icon: 'mdi-arrow-right-bold', color: 'green' },
                  costo_indirecto: { label: 'Costo indirecto', icon: 'mdi-arrow-expand-all', color: 'purple' },
                  costo_total: { label: 'Costo total', icon: 'mdi-calculator', color: 'primary' },
                  costo_total_igv: { label: 'Costo total (IGV)', icon: 'mdi-percent', color: 'primary' }
                }" :key="key">
                  <v-sheet 
                    class="summary-item pa-4" 
                    rounded 
                    border
                    :color="key.includes('total') ? 'primary' : 'transparent'"
                    :variant="key.includes('total') ? 'tonal' : 'outlined'"
                  >
                    <div class="d-flex align-center mb-2">
                      <v-icon :color="item.color" class="mr-2">{{ item.icon }}</v-icon>
                      <span class="text-body-2 text-medium-emphasis">{{ item.label }}</span>
                    </div>
                    <div class="text-h6 font-weight-bold">
                      {{ fmtCurrency(resumen.resumen[key]) }}
                    </div>
                  </v-sheet>
                </v-col>
              </v-row>
            </div>
            <div v-else>
              <v-alert type="info" variant="tonal" class="text-center">
                <v-icon class="mb-2">mdi-information-outline</v-icon>
                <div>Aún no hay resumen calculado</div>
                <div class="text-body-2">Presiona "Actualizar" para generar el resumen</div>
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Categorías pendientes -->
      <v-col cols="12" lg="4">
        <v-card class="pending-categories-card" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
            Categorías pendientes
          </v-card-title>
          
          <v-card-text class="pa-4">
            <div v-if="categoriesEmpty.length === 0" class="text-center py-4">
              <v-icon color="success" size="48" class="mb-2">mdi-check-circle</v-icon>
              <div class="text-body-1 font-weight-medium">¡Todo listo!</div>
              <div class="text-body-2 text-medium-emphasis">No hay categorías pendientes</div>
            </div>
            <div v-else>
              <v-alert type="warning" variant="tonal" class="mb-4" density="compact">
                Faltan agregar elementos al costeo
              </v-alert>
              <v-list density="compact" class="pending-list">
                <v-list-item 
                  v-for="k in categoriesEmpty" 
                  :key="k"
                  class="pending-item"
                  @click="startCreateForKey(k)"
                >
                  <template #prepend>
                    <v-icon :color="'primary'" size="small">{{ getIconForCategory(k) }}</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ displayLabelForKey(k) }}</v-list-item-title>
                  <template #append>
                    <v-btn 
                      color="primary" 
                      variant="tonal" 
                      size="small"
                      @click.stop="startCreateForKey(k)"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tablas por categoría -->
    <div v-if="categoriesWithRows.length > 0" class="categories-section mt-6">
      <div class="text-h5 mb-4 d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-table</v-icon>
        Detalles por categoría
      </div>
      
      <v-row>
        <v-col cols="12" v-for="key in categoriesWithRows" :key="key">
          <v-card class="category-card" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <v-icon :color="'primary'" class="mr-2">{{ getIconForCategory(key) }}</v-icon>
                <span>{{ displayLabelForKey(key) }}</span>
              </div>
              <v-btn 
                color="primary" 
                variant="elevated" 
                @click="startCreateForKey(key)"
                size="small"
              >
                <v-icon start>mdi-plus</v-icon>
                Agregar
              </v-btn>
            </v-card-title>
            
            <v-card-text class="pa-0">
              <v-table density="comfortable" class="category-table">
                <thead>
                  <tr>
                    <th class="text-left">ID</th>
                    <th v-for="col in Object.keys(resumen[key][0]).filter(k => !['id','created_at','descripcion_trabajo_id'].includes(k))" :key="col" class="text-left">
                      {{ col }}
                    </th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in resumen[key]" :key="row.id" class="table-row">
                    <td class="font-weight-medium">{{ row.id }}</td>
                    <td v-for="col in Object.keys(resumen[key][0]).filter(k => !['id','created_at','descripcion_trabajo_id'].includes(k))" :key="col">
                      <span v-if="/precio|sub_total|precio_unitario|costo/i.test(col)" class="currency-value">
                        {{ fmtCurrency(row[col]) }}
                      </span>
                      <span v-else>{{ row[col] }}</span>
                    </td>
                    <td class="text-center">
                      <v-btn 
                        size="small" 
                        variant="tonal" 
                        color="primary"
                        @click="startEditForKey(key, row)" 
                        class="mr-2"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn 
                        size="small" 
                        variant="tonal" 
                        color="error" 
                        @click="deleteRowForKey(key, row)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Diálogo Crear -->
    <v-dialog v-model="createDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-plus-circle</v-icon>
          Agregar costo ({{ category }})
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form @submit.prevent="enviarCosto">
            <v-row>
              <v-col cols="12" v-for="f in fieldsByCategory[category]" :key="f.key">
                <v-text-field 
                  :label="f.label" 
                  :type="f.type" 
                  :step="f.step || undefined" 
                  v-model="payload[f.key]"
                  variant="outlined"
                  :prepend-inner-icon="f.icon"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <div class="d-flex justify-end gap-3 mt-4">
              <v-btn variant="outlined" @click="createDialog = false">
                <v-icon start>mdi-cancel</v-icon>
                Cancelar
              </v-btn>
              <v-btn type="submit" color="primary" variant="elevated">
                <v-icon start>mdi-check</v-icon>
                Crear
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo Editar -->
    <v-dialog v-model="editDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-pencil</v-icon>
          Editar costo ({{ category }})
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form @submit.prevent="async () => { await actualizarCostoSubmit(); editDialog = false }">
            <v-text-field 
              label="ID del costo" 
              v-model="update.id" 
              readonly 
              variant="outlined"
              prepend-inner-icon="mdi-identifier"
              class="mb-4"
            />
            <v-row>
              <v-col cols="12" v-for="f in fieldsByCategory[category]" :key="f.key">
                <v-text-field 
                  :label="f.label" 
                  :type="f.type" 
                  :step="f.step || undefined" 
                  v-model="update.body[f.key]"
                  variant="outlined"
                  :prepend-inner-icon="f.icon"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <div class="d-flex justify-end gap-3 mt-4">
              <v-btn variant="outlined" @click="editDialog = false">
                <v-icon start>mdi-cancel</v-icon>
                Cancelar
              </v-btn>
              <v-btn type="submit" color="primary" variant="elevated">
                <v-icon start>mdi-content-save</v-icon>
                Guardar
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo Actualizar (global) -->
    <v-dialog v-model="updateDialog" max-width="700" persistent @update:model-value="val => { if (!val) update.value = { id: '', body: {} } }">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-update</v-icon>
          Actualizar costo
        </v-card-title>
        <v-card-text class="pa-6">
          <v-select 
            label="Categoría" 
            v-model="category" 
            :items="CategoriasCostos" 
            variant="outlined"
            prepend-inner-icon="mdi-tag"
            class="mb-4"
          />
          <v-form @submit.prevent="async () => { await actualizarCostoSubmit(); updateDialog = false }">
            <v-text-field 
              label="ID del costo" 
              v-model="update.id" 
              placeholder="Ingrese el ID del costo"
              variant="outlined"
              prepend-inner-icon="mdi-identifier"
              class="mb-4"
            />
            <v-row>
              <v-col cols="12" v-for="f in fieldsByCategory[category]" :key="f.key">
                <v-text-field 
                  :label="f.label" 
                  :type="f.type" 
                  :step="f.step || undefined" 
                  v-model="update.body[f.key]"
                  variant="outlined"
                  :prepend-inner-icon="f.icon"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <div class="d-flex justify-end gap-3 mt-4">
              <v-btn variant="outlined" @click="updateDialog = false">
                <v-icon start>mdi-cancel</v-icon>
                Cancelar
              </v-btn>
              <v-btn type="submit" color="primary" variant="elevated">
                <v-icon start>mdi-content-save</v-icon>
                Guardar
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo Eliminar (global) -->
    <v-dialog v-model="deleteDialog" max-width="600" persistent @update:model-value="val => { if (!val) del.value.id = '' }">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-delete</v-icon>
          Eliminar costo
        </v-card-title>
        <v-card-text class="pa-6">
          <v-select 
            label="Categoría" 
            v-model="category" 
            :items="CategoriasCostos" 
            variant="outlined"
            prepend-inner-icon="mdi-tag"
            class="mb-4"
          />
          <v-form @submit.prevent="async () => { await eliminarCostoSubmit(); deleteDialog = false }">
            <v-text-field 
              label="ID del costo" 
              v-model="del.id" 
              placeholder="Ingrese el ID del costo a eliminar"
              variant="outlined"
              prepend-inner-icon="mdi-identifier"
              class="mb-4"
            />
            <v-alert type="warning" variant="tonal" class="mb-4">
              <v-icon class="mr-2">mdi-alert-triangle</v-icon>
              Esta acción no se puede deshacer
            </v-alert>
            <div class="d-flex justify-end gap-3">
              <v-btn variant="outlined" @click="deleteDialog = false">
                <v-icon start>mdi-cancel</v-icon>
                Cancelar
              </v-btn>
              <v-btn type="submit" color="error" variant="elevated">
                <v-icon start>mdi-delete</v-icon>
                Eliminar
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

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
.proyecto-detalle-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out;
}

.header-section {
  margin-bottom: 32px;
}

.back-button {
  margin-bottom: 16px;
  animation: slideInLeft 0.5s ease-out;
}

.project-header {
  text-align: center;
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.project-info-card {
  border-radius: 16px !important;
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.info-item .label {
  font-weight: 500;
  margin-right: 8px;
  min-width: 120px;
}

.info-item .value {
  font-weight: 600;
}

.action-buttons-section {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  animation: slideInUp 0.6s ease-out 0.3s both;
}

.summary-card, .pending-categories-card {
  border-radius: 16px !important;
  animation: slideInUp 0.6s ease-out 0.4s both;
}

.summary-item {
  transition: all 0.3s ease;
  cursor: pointer;
}

.summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pending-list .pending-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.pending-list .pending-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.categories-section {
  animation: slideInUp 0.6s ease-out 0.5s both;
}

.category-card {
  border-radius: 16px !important;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.category-table .table-row {
  transition: background-color 0.2s ease;
}

.category-table .table-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.currency-value {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.gap-3 {
  gap: 12px;
}

/* Animaciones */
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .proyecto-detalle-container {
    padding: 16px;
  }
  
  .action-buttons-section {
    flex-direction: column;
  }
  
  .action-buttons-section .v-btn {
    width: 100%;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item .label {
    min-width: auto;
    margin-bottom: 4px;
  }
}
</style>