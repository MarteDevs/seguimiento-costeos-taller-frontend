<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ProyectosService } from '../services/proyectosService'
import { crearCosto, actualizarCosto, eliminarCosto, CategoriasCostos } from '../services/costosService'
import { SeguimientoService } from '../services/seguimientoService'

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
    proyecto.value = p.data ?? p
    resumen.value = r.data ?? r
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
    { key: 'trabajador', label: 'Trabajador', type: 'text' },
    { key: 'cantidad_trabajador', label: 'Cantidad de trabajador', type: 'number' },
    { key: 'precio', label: 'Precio', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'local': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'vigilancia': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'energia': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'herramientas-otros': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'materiales': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'unidad', label: 'Unidad', type: 'text' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'cantidad_usado', label: 'Cantidad usado', type: 'number' },
  ],
  'implementos-seguridad': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'petroleo': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'gasolina': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'topico': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'equipo-otro': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.0001' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
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

// =====================
// Seguimiento: Tareas
// =====================
const tareas = ref([])
const tareasLoading = ref(false)
const tareasError = ref('')
const tareasLoaded = ref(false)
const tareasDialog = ref(false)
const tareaEditDialog = ref(false)
const tareaDeleteDialog = ref(false)
const tareaForm = ref({ fecha: '', dia: null, tareas_realizadas: null, comentario: '' })
const tareaEdit = ref({ id: '', fields: { fecha: '', dia: null, tareas_realizadas: null, comentario: '' } })
const tareaDeleteId = ref('')

async function cargarTareas() {
  tareasLoading.value = true
  tareasError.value = ''
  try {
    const r = await SeguimientoService.tareas.list(id)
    const d = r?.data ?? r
    const arr = Array.isArray(d) ? d : (Array.isArray(d?.tareas) ? d.tareas : (Array.isArray(d?.data) ? d.data : []))
    tareas.value = arr
    tareasLoaded.value = true
  } catch (e) { tareasError.value = e.message; notify(e.message, 'error') }
  finally { tareasLoading.value = false }
}

function abrirCrearTarea() {
  tareaForm.value = { fecha: '', dia: null, tareas_realizadas: null, comentario: '' }
  tareasDialog.value = true
}

async function crearTareaSubmit() {
  tareasError.value = ''
  try {
    const body = { ...tareaForm.value }
    ;['dia','tareas_realizadas'].forEach(k => {
      if (body[k] !== '' && body[k] !== null) body[k] = Number(body[k])
    })
    await SeguimientoService.tareas.create(id, body)
    await cargarTareas()
    tareasDialog.value = false
    notify('Seguimiento de tareas creado', 'success')
  } catch (e) { tareasError.value = e.message; notify(e.message, 'error') }
}

function abrirEditarTarea(row) {
  tareaEdit.value = { id: row.id, fields: {
    fecha: row.fecha ?? '',
    dia: row.dia ?? null,
    tareas_realizadas: row.tareas_realizadas ?? null,
    comentario: row.comentario ?? ''
  }}
  tareaEditDialog.value = true
}

async function actualizarTareaSubmit() {
  tareasError.value = ''
  try {
    const body = { ...tareaEdit.value.fields }
    ;['dia','tareas_realizadas'].forEach(k => {
      if (body[k] !== '' && body[k] !== null) body[k] = Number(body[k])
    })
    await SeguimientoService.tareas.update(id, tareaEdit.value.id, body)
    await cargarTareas()
    tareaEditDialog.value = false
    notify('Seguimiento de tareas actualizado', 'success')
  } catch (e) { tareasError.value = e.message; notify(e.message, 'error') }
}

function abrirEliminarTarea(row) {
  tareaDeleteId.value = row.id
  tareaDeleteDialog.value = true
}

async function eliminarTareaSubmit() {
  tareasError.value = ''
  try {
    await SeguimientoService.tareas.delete(id, tareaDeleteId.value)
    await cargarTareas()
    tareaDeleteDialog.value = false
    tareaDeleteId.value = ''
    notify('Seguimiento de tareas eliminado', 'success')
  } catch (e) { tareasError.value = e.message; notify(e.message, 'error') }
}

// =====================
// Seguimiento: Materiales
// =====================
const materialLogs = ref([])
const materialesLoading = ref(false)
const materialesError = ref('')
const materialesLoaded = ref(false)
const materialUsoDialog = ref(false)
const selectedMaterialId = ref('')
const materialUsoForm = ref({ fecha: '', cantidad_usada: null, comentario: '' })

async function cargarMaterialLogs() {
  materialesLoading.value = true
  materialesError.value = ''
  try {
    const r = await SeguimientoService.materiales.listLogs(id)
    const d = r?.data ?? r
    const arr = Array.isArray(d) ? d : (Array.isArray(d?.logs) ? d.logs : (Array.isArray(d?.data) ? d.data : []))
    materialLogs.value = arr
    materialesLoaded.value = true
  } catch (e) { materialesError.value = e.message; notify(e.message, 'error') }
  finally { materialesLoading.value = false }
}

async function cargarLogsDeMaterial() {
  if (!selectedMaterialId.value) return
  materialesLoading.value = true
  try {
    const r = await SeguimientoService.materiales.getLogsByMaterial(id, selectedMaterialId.value)
    materialLogs.value = r?.data ?? r ?? []
  } catch (e) { materialesError.value = e.message }
  finally { materialesLoading.value = false }
}

function abrirRegistrarUso() {
  if (!selectedMaterialId.value) { notify('Selecciona un material primero', 'warning'); return }
  materialUsoForm.value = { fecha: '', cantidad_usada: null, comentario: '' }
  materialUsoDialog.value = true
}

async function registrarUsoSubmit() {
  materialesError.value = ''
  try {
    const body = { ...materialUsoForm.value, material_id: selectedMaterialId.value }
    if (body.cantidad_usada !== '' && body.cantidad_usada !== null) body.cantidad_usada = Number(body.cantidad_usada)
    await SeguimientoService.materiales.registrarUso(id, selectedMaterialId.value, body)
    await cargarLogsDeMaterial()
    materialUsoDialog.value = false
    notify('Uso de material registrado', 'success')
  } catch (e) { materialesError.value = e.message; notify(e.message, 'error') }
}

// =====================
// Seguimiento: Avance
// =====================
const avance = ref(null)
const avanceLoading = ref(false)
const avanceError = ref('')
const seguimientoDialog = ref(false)
const seguimientoTab = ref('tareas')

async function cargarAvance() {
  avanceLoading.value = true
  avanceError.value = ''
  try {
    const r = await SeguimientoService.avance(id)
    avance.value = r?.data ?? r ?? null
  } catch (e) { avanceError.value = e.message }
  finally { avanceLoading.value = false }
}

function abrirManifiesto() {
  const url = SeguimientoService.manifiestoUrl(id)
  window.open(url, '_blank')
}

// Avance desglosado para UI
const avanceDias = computed(() => avance.value?.dias || null)
const avanceTareas = computed(() => avance.value?.tareas || null)
const avanceMateriales = computed(() => avance.value?.materiales || null)
const materialesDetalle = computed(() => {
  const det = avanceMateriales.value?.detalle
  return Array.isArray(det) ? det : []
})

// Cargar módulos de seguimiento al entrar
onMounted(() => {
  cargarAvance()
})

watch(seguimientoDialog, (open) => {
  if (open) {
    if (seguimientoTab.value === 'tareas' && !tareasLoaded.value) cargarTareas()
    if (seguimientoTab.value === 'materiales' && !materialesLoaded.value) cargarMaterialLogs()
  }
})
watch(seguimientoTab, (tab) => {
  if (!seguimientoDialog.value) return
  if (tab === 'tareas' && !tareasLoaded.value) cargarTareas()
  if (tab === 'materiales' && !materialesLoaded.value) cargarMaterialLogs()
})
</script>

<template>
  <v-container>
    <v-btn variant="tonal" class="mb-3" @click="$router.back()">← Volver</v-btn>
    <h1 class="mb-1">Detalle del proyecto</h1>
    <div class="text-medium-emphasis">ID: {{ id }}</div>
    <v-alert v-if="error" type="error" class="mt-3" density="compact">{{ error }}</v-alert>
    <div v-if="loading" class="py-2">
      <v-progress-linear indeterminate color="primary" />
    </div>

    <v-card v-if="proyecto" class="mb-4">
      <v-card-title>{{ proyecto.nombre_del_proyecto }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6"><strong>Mina:</strong> {{ proyecto.mina }}</v-col>
          <v-col cols="12" md="6"><strong>Equipo:</strong> {{ proyecto.equipo }}</v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Botones superiores para acciones globales -->
    <div class="d-flex justify-end mb-3">
      <v-btn variant="tonal" class="mr-2" @click="seguimientoDialog = true">Seguimiento</v-btn>
      <v-btn variant="tonal" class="mr-2" @click="updateDialog = true">Actualizar costo</v-btn>
      <v-btn variant="tonal" color="error" @click="deleteDialog = true">Eliminar costo</v-btn>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Resumen</v-card-title>
          <v-card-text>
        <div class="d-flex justify-space-between align-center mb-3">
          <div class="text-medium-emphasis">Última actualización del cálculo</div>
          <v-btn color="primary" @click="actualizarResumen">Actualizar resumen</v-btn>
        </div>

        <div v-if="resumen?.resumen">
          <v-row>
            <v-col cols="12" md="6">
              <v-sheet class="pa-3" rounded border>
                <div class="text-medium-emphasis">Costo fijo</div>
                <div class="text-h6">{{ fmtCurrency(resumen.resumen.costo_fijo) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="6">
              <v-sheet class="pa-3" rounded border>
                <div class="text-medium-emphasis">Costo variable</div>
                <div class="text-h6">{{ fmtCurrency(resumen.resumen.costo_variable) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="6">
              <v-sheet class="pa-3" rounded border>
                <div class="text-medium-emphasis">Costo directo</div>
                <div class="text-h6">{{ fmtCurrency(resumen.resumen.costo_directo) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="6">
              <v-sheet class="pa-3" rounded border>
                <div class="text-medium-emphasis">Costo indirecto</div>
                <div class="text-h6">{{ fmtCurrency(resumen.resumen.costo_indirecto) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="6">
              <v-sheet class="pa-3" rounded border color="primary" variant="tonal">
                <div class="text-medium-emphasis">Costo total</div>
                <div class="text-h6">{{ fmtCurrency(resumen.resumen.costo_total) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="6">
              <v-sheet class="pa-3" rounded border color="primary" variant="tonal">
                <div class="text-medium-emphasis">Costo total (IGV)</div>
                <div class="text-h6">{{ fmtCurrency(resumen.resumen.costo_total_igv) }}</div>
              </v-sheet>
            </v-col>
          </v-row>
        </div>
        <div v-else>
          <v-alert type="info" variant="tonal">Aún no hay resumen calculado. Presiona "Actualizar resumen".</v-alert>
        </div>
      </v-card-text>
    </v-card>
  </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Categorías pendientes</v-card-title>
          <v-card-text>
            <div v-if="categoriesEmpty.length === 0" class="text-medium-emphasis">Todo listo, no hay categorías pendientes.</div>
            <div v-else>
              <v-alert type="warning" variant="tonal" class="mb-3">Faltan agregar más cosas al costeo.</v-alert>
              <v-list density="comfortable">
                <v-list-item v-for="k in categoriesEmpty" :key="k">
                  <v-list-item-title>{{ displayLabelForKey(k) }}</v-list-item-title>
                  <template #append>
                    <v-btn color="primary" variant="tonal" @click="startCreateForKey(k)">Agregar</v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Seguimiento en modal -->
  <v-dialog v-model="seguimientoDialog" max-width="1000">
    <v-card>
      <v-card-title>Seguimiento</v-card-title>
      <v-tabs v-model="seguimientoTab" fixed-tabs>
        <v-tab value="tareas">Tareas</v-tab>
        <v-tab value="materiales">Materiales</v-tab>
      </v-tabs>
      <v-window v-model="seguimientoTab">
        <v-window-item value="tareas">
          <v-card flat>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Seguimiento de tareas</span>
              <v-btn size="small" color="primary" variant="tonal" @click="abrirCrearTarea">Nueva tarea</v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="tareasLoading" class="py-2"><v-progress-linear indeterminate color="primary" /></div>
              <v-alert v-if="tareasError" type="error" class="mb-3" density="compact">{{ tareasError }}</v-alert>
              <v-data-table :items="Array.isArray(tareas) ? tareas : []" :headers="[
                { title: 'Fecha', key: 'fecha' },
                { title: 'Día', key: 'dia' },
                { title: 'Tareas realizadas', key: 'tareas_realizadas' },
                { title: 'Comentario', key: 'comentario' },
                { title: 'Acciones', key: 'actions', sortable: false },
              ]" item-key="id">
                <template #item.actions="{ item }">
                  <v-btn size="x-small" variant="text" @click="abrirEditarTarea(item)">Editar</v-btn>
                  <v-btn size="x-small" variant="text" color="error" @click="abrirEliminarTarea(item)">Eliminar</v-btn>
                </template>
                <template #no-data>
                  <div class="text-medium-emphasis">Aún no hay tareas registradas.</div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>
        <v-window-item value="materiales">
          <v-card flat>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Logs de materiales</span>
              <div class="d-flex align-center gap-2">
                <v-select
                  density="comfortable"
                  style="max-width:220px"
                  :items="(resumen?.materiales || []).map(m => ({
                    title: `${m.descripcion} (${m.id ?? m.material_id ?? '?'})`,
                    value: m.id ?? m.material_id
                  }))"
                  v-model="selectedMaterialId"
                  label="Material"
                  @update:modelValue="cargarLogsDeMaterial"
                />
                <v-btn size="small" color="primary" variant="tonal" @click="abrirRegistrarUso">Registrar uso</v-btn>
              </div>
            </v-card-title>
            <v-card-text>
              <div v-if="materialesLoading" class="py-2"><v-progress-linear indeterminate color="primary" /></div>
              <v-alert v-if="materialesError" type="error" class="mb-3" density="compact">{{ materialesError }}</v-alert>
              <v-data-table :items="Array.isArray(materialLogs) ? materialLogs : []" :headers="[
                { title: 'Fecha', key: 'fecha' },
                { title: 'Material ID', key: 'material_id' },
                { title: 'Cantidad usada', key: 'cantidad_usada' },
                { title: 'Comentario', key: 'comentario' },
              ]" item-key="id">
                <template #no-data>
                  <div class="text-medium-emphasis">Sin registros. Selecciona un material o registra un uso.</div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="seguimientoDialog = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Avance y Manifiesto -->
  <v-row>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Avance del proyecto</span>
          <v-btn size="small" variant="tonal" @click="cargarAvance">Actualizar avance</v-btn>
        </v-card-title>
        <v-card-text>
          <div v-if="avanceLoading" class="py-2"><v-progress-linear indeterminate color="primary" /></div>
          <v-alert v-if="avanceError" type="error" class="mb-3" density="compact">{{ avanceError }}</v-alert>
          <div v-if="avance">
            <!-- Resumen de días y tareas -->
            <v-row>
              <v-col cols="12" md="6">
                <v-sheet rounded border class="pa-3">
                  <div class="text-medium-emphasis mb-2">Días</div>
                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <v-chip variant="tonal" density="comfortable">Totales: {{ avanceDias?.diasTotales ?? 0 }}</v-chip>
                    <v-chip variant="tonal" density="comfortable">Reportados: {{ avanceDias?.diasReportados ?? 0 }}</v-chip>
                  </div>
                  <v-progress-linear :model-value="Math.max(0, Math.min(100, avanceDias?.avanceDiasPct ?? 0))" color="primary" />
                  <div class="text-caption mt-1">{{ fmtPercent(avanceDias?.avanceDiasPct ?? 0) }}</div>
                </v-sheet>
              </v-col>
              <v-col cols="12" md="6">
                <v-sheet rounded border class="pa-3">
                  <div class="text-medium-emphasis mb-2">Tareas</div>
                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <v-chip variant="tonal" density="comfortable">Totales: {{ avanceTareas?.tareasTotales ?? 0 }}</v-chip>
                    <v-chip variant="tonal" density="comfortable">Realizadas: {{ avanceTareas?.tareasRealizadas ?? 0 }}</v-chip>
                  </div>
                  <v-progress-linear :model-value="Math.max(0, Math.min(100, avanceTareas?.avanceTareasPct ?? 0))" color="primary" />
                  <div class="text-caption mt-1">{{ fmtPercent(avanceTareas?.avanceTareasPct ?? 0) }}</div>
                </v-sheet>
              </v-col>
            </v-row>

            <!-- Materiales -->
            <v-divider class="my-4" />
            <div>
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-medium-emphasis">Materiales</div>
                <v-chip color="primary" variant="tonal">Avance: {{ fmtPercent(avanceMateriales?.avanceMaterialesPct ?? 0) }}</v-chip>
              </div>
              <v-progress-linear :model-value="Math.max(0, Math.min(100, avanceMateriales?.avanceMaterialesPct ?? 0))" color="primary" class="mb-3" />
              <v-data-table
                :items="materialesDetalle"
                :headers="[
                  { title: 'ID', key: 'id' },
                  { title: 'Descripción', key: 'descripcion' },
                  { title: 'Cant. total', key: 'cantidad_total' },
                  { title: 'Cant. usado', key: 'cantidad_usado' },
                  { title: 'Avance', key: 'avance_pct' },
                ]"
                item-key="id"
              >
                <template #item.cantidad_total="{ item }">{{ item.cantidad_total }}</template>
                <template #item.cantidad_usado="{ item }">{{ item.cantidad_usado }}</template>
                <template #item.avance_pct="{ item }">
                  <div class="d-flex align-center" style="min-width:140px">
                    <v-progress-linear :model-value="Math.max(0, Math.min(100, Number(item.avance_pct) || 0))" color="primary" style="flex:1" />
                    <span class="text-caption ml-2">{{ fmtPercent(Number(item.avance_pct) || 0) }}</span>
                  </div>
                </template>
                <template #no-data>
                  <div class="text-medium-emphasis">Sin detalle de materiales.</div>
                </template>
              </v-data-table>
            </div>
          </div>
          <div v-else class="text-medium-emphasis">Sin datos de avance.</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Manifiesto</v-card-title>
        <v-card-text>
          <v-btn color="primary" @click="abrirManifiesto">Abrir manifiesto PDF</v-btn>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Tablas por categoría -->
  <v-row class="mt-4">
    <v-col cols="12" v-for="key in categoriesWithRows" :key="key">
      <v-card>
        <v-card-title>
          <div class="d-flex justify-space-between align-center w-100">
            <span>{{ displayLabelForKey(key) }}</span>
            <v-btn color="primary" variant="tonal" @click="startCreateForKey(key)">Agregar</v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-table density="comfortable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th v-for="col in Object.keys(resumen[key][0]).filter(k => !['id','created_at','descripcion_trabajo_id'].includes(k))" :key="col">{{ col }}</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in resumen[key]" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td v-for="col in Object.keys(resumen[key][0]).filter(k => !['id','created_at','descripcion_trabajo_id'].includes(k))" :key="col">
                    <span v-if="/precio|sub_total|precio_unitario|costo/i.test(col)">{{ fmtCurrency(row[col]) }}</span>
                    <span v-else>{{ row[col] }}</span>
                  </td>
                  <td>
                    <v-btn size="small" variant="tonal" @click="startEditForKey(key, row)" class="mr-1">Editar</v-btn>
                    <v-btn size="small" variant="tonal" color="error" @click="deleteRowForKey(key, row)">Eliminar</v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Diálogo Crear -->
  <v-dialog v-model="createDialog" max-width="600">
    <v-card>
      <v-card-title>Agregar costo ({{ category }})</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="enviarCosto">
          <div v-for="f in fieldsByCategory[category]" :key="f.key" class="mb-2">
            <v-text-field :label="f.label" :type="f.type" :step="f.step || undefined" v-model="payload[f.key]" />
          </div>
          <div class="d-flex gap-2">
            <v-btn type="submit" color="primary">Crear</v-btn>
            <v-btn variant="tonal" @click="createDialog = false">Cancelar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Diálogo Editar -->
  <v-dialog v-model="editDialog" max-width="600">
    <v-card>
      <v-card-title>Editar costo ({{ category }})</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="async () => { await actualizarCostoSubmit(); editDialog = false }">
          <v-text-field label="ID del costo" v-model="update.id" readonly />
          <div v-for="f in fieldsByCategory[category]" :key="f.key" class="mb-2">
            <v-text-field :label="f.label" :type="f.type" :step="f.step || undefined" v-model="update.body[f.key]" />
          </div>
          <div class="d-flex gap-2">
            <v-btn type="submit" color="primary">Guardar</v-btn>
            <v-btn variant="tonal" @click="editDialog = false">Cancelar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Diálogo Actualizar (global) -->
  <v-dialog v-model="updateDialog" max-width="700" @update:model-value="val => { if (!val) update.value = { id: '', body: {} } }">
    <v-card>
      <v-card-title>Actualizar costo</v-card-title>
      <v-card-text>
        <v-select label="Categoría" v-model="category" :items="CategoriasCostos" class="mb-2" />
        <v-form @submit.prevent="async () => { await actualizarCostoSubmit(); updateDialog = false }">
          <v-text-field label="ID del costo" v-model="update.id" placeholder="ID" />
          <div v-for="f in fieldsByCategory[category]" :key="f.key" class="mb-2">
            <v-text-field :label="f.label" :type="f.type" :step="f.step || undefined" v-model="update.body[f.key]" />
          </div>
          <div class="d-flex gap-2">
            <v-btn type="submit" color="primary">Guardar</v-btn>
            <v-btn variant="tonal" @click="updateDialog = false">Cancelar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Diálogo Eliminar (global) -->
  <v-dialog v-model="deleteDialog" max-width="600" @update:model-value="val => { if (!val) del.value.id = '' }">
    <v-card>
      <v-card-title>Eliminar costo</v-card-title>
      <v-card-text>
        <v-select label="Categoría" v-model="category" :items="CategoriasCostos" class="mb-2" />
        <v-form @submit.prevent="async () => { await eliminarCostoSubmit(); deleteDialog = false }">
          <v-text-field label="ID del costo" v-model="del.id" placeholder="ID" />
          <div class="d-flex gap-2">
            <v-btn type="submit" color="error" variant="tonal">Eliminar</v-btn>
            <v-btn variant="tonal" @click="deleteDialog = false">Cancelar</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Snackbar de confirmación -->
  <v-snackbar v-model="toast.show" :color="toast.color" timeout="2500" location="top">{{ toast.message }}</v-snackbar>

  <!-- Dialogos Seguimiento: Tareas -->
  <v-dialog v-model="tareasDialog" max-width="560">
    <v-card>
      <v-card-title>Nueva tarea</v-card-title>
      <v-card-text>
        <v-text-field label="Fecha" type="date" v-model="tareaForm.fecha" required />
        <v-text-field label="Día" type="number" v-model="tareaForm.dia" required />
        <v-text-field label="Tareas realizadas" type="number" v-model="tareaForm.tareas_realizadas" required />
        <v-text-field label="Comentario" v-model="tareaForm.comentario" />
        <v-alert v-if="tareasError" type="error" class="mt-2" density="compact">{{ tareasError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="tareasDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="crearTareaSubmit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="tareaEditDialog" max-width="560">
    <v-card>
      <v-card-title>Editar tarea</v-card-title>
      <v-card-text>
        <v-text-field label="Fecha" type="date" v-model="tareaEdit.fields.fecha" required />
        <v-text-field label="Día" type="number" v-model="tareaEdit.fields.dia" required />
        <v-text-field label="Tareas realizadas" type="number" v-model="tareaEdit.fields.tareas_realizadas" required />
        <v-text-field label="Comentario" v-model="tareaEdit.fields.comentario" />
        <v-alert v-if="tareasError" type="error" class="mt-2" density="compact">{{ tareasError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="tareaEditDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="actualizarTareaSubmit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="tareaDeleteDialog" max-width="480">
    <v-card>
      <v-card-title>Eliminar tarea</v-card-title>
      <v-card-text>¿Seguro que deseas eliminar esta tarea?</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="tareaDeleteDialog = false">Cancelar</v-btn>
        <v-btn color="error" @click="eliminarTareaSubmit">Eliminar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialogo Seguimiento: Registrar uso de material -->
  <v-dialog v-model="materialUsoDialog" max-width="560">
    <v-card>
      <v-card-title>Registrar uso de material</v-card-title>
      <v-card-text>
        <v-text-field label="Fecha" type="date" v-model="materialUsoForm.fecha" required />
        <v-text-field label="Cantidad usada" type="number" v-model="materialUsoForm.cantidad_usada" required />
        <v-text-field label="Comentario" v-model="materialUsoForm.comentario" />
        <v-alert v-if="materialesError" type="error" class="mt-2" density="compact">{{ materialesError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="materialUsoDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="registrarUsoSubmit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    <!-- Tarjetas inferiores de actualizar/eliminar removidas en favor de modales superiores -->
  </v-container>
</template>

<style scoped>
.pre { white-space: pre-wrap; background: #f9fafb; border: 1px solid #eee; padding: 0.75rem; border-radius: 6px; }
.gap-2 { gap: 0.5rem; }
</style>