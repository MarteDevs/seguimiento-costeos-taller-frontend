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
  const num = typeof v === 'string' ? Number(v) : v
  if (num == null || Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(num)
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
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'vigilancia': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'energia': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'herramientas-otros': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'promedio', label: 'Promedio', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'materiales': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'unidad', label: 'Unidad', type: 'text' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'cantidad_usado', label: 'Cantidad usado', type: 'number' },
  ],
  'implementos-seguridad': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'petroleo': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'gasolina': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'topico': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
    { key: 'dias_trabajados', label: 'Días trabajados', type: 'number' },
  ],
  'equipo-otro': [
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'number' },
    { key: 'precio_unitario', label: 'Precio unitario', type: 'number', step: '0.01' },
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
    // convierte numéricos
    Object.keys(body).forEach(k => {
      const field = fieldsByCategory[category.value].find(f => f.key === k)
      if (field && field.type === 'number' && body[k] !== '' && body[k] !== null) {
        body[k] = Number(body[k])
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
        body[k] = Number(body[k])
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

    <!-- Tarjetas inferiores de actualizar/eliminar removidas en favor de modales superiores -->
  </v-container>
</template>

<style scoped>
.pre { white-space: pre-wrap; background: #f9fafb; border: 1px solid #eee; padding: 0.75rem; border-radius: 6px; }
.gap-2 { gap: 0.5rem; }
</style>