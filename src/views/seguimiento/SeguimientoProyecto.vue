<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ProyectosService } from '../../services/proyectosService'
import { SeguimientoService } from '../../services/seguimientoService'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const proyecto = ref(null)
const resumen = ref(null)
const loading = ref(false)
const error = ref('')
const toast = ref({ show: false, message: '', color: 'success' })
function notify(message, color = 'success') { toast.value = { show: true, message, color } }

async function cargar() {
  loading.value = true
  error.value = ''
  try {
    const [p, r] = await Promise.all([
      ProyectosService.get(id),
      ProyectosService.resumen(id)
    ])
    const pd = p?.data ?? p
    proyecto.value = (pd?.data && typeof pd.data === 'object') ? pd.data : (pd?.proyecto ?? pd)
    const rd = r?.data ?? r
    resumen.value = rd?.data && typeof rd.data === 'object' ? rd.data : rd
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

// =====================
// Tareas
// =====================
const tareas = ref([])
const tareasLoading = ref(false)
const tareasError = ref('')
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
  } catch (e) { tareasError.value = e.message; notify(e.message, 'error') }
  finally { tareasLoading.value = false }
}

function abrirCrearTarea() { tareaForm.value = { fecha: '', dia: null, tareas_realizadas: null, comentario: '' }; tareasDialog.value = true }

async function crearTareaSubmit() {
  tareasError.value = ''
  try {
    const body = { ...tareaForm.value }
    ;['dia','tareas_realizadas'].forEach(k => { if (body[k] !== '' && body[k] !== null) body[k] = Number(body[k]) })
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
    ;['dia','tareas_realizadas'].forEach(k => { if (body[k] !== '' && body[k] !== null) body[k] = Number(body[k]) })
    await SeguimientoService.tareas.update(id, tareaEdit.value.id, body)
    await cargarTareas()
    tareaEditDialog.value = false
    notify('Seguimiento de tareas actualizado', 'success')
  } catch (e) { tareasError.value = e.message; notify(e.message, 'error') }
}

function abrirEliminarTarea(row) { tareaDeleteId.value = row.id; tareaDeleteDialog.value = true }

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
// Materiales
// =====================
const materialLogs = ref([])
const materialesLoading = ref(false)
const materialesError = ref('')
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

function abrirRegistrarUso() { if (!selectedMaterialId.value) { notify('Selecciona un material primero', 'warning'); return } materialUsoForm.value = { fecha: '', cantidad_usada: null, comentario: '' }; materialUsoDialog.value = true }

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
// Avance
// =====================
const avance = ref(null)
const avanceLoading = ref(false)
const avanceError = ref('')
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

function abrirManifiesto() { const url = SeguimientoService.manifiestoUrl(id); window.open(url, '_blank') }

// Avance desglosado para UI
const avanceDias = computed(() => avance.value?.dias || null)
const avanceTareas = computed(() => avance.value?.tareas || null)
const avanceMateriales = computed(() => avance.value?.materiales || null)
const materialesDetalle = computed(() => {
  const det = avanceMateriales.value?.detalle
  return Array.isArray(det) ? det : []
})

function fmtPercent(n) {
  const v = Number(n) || 0
  return `${v.toFixed(1)}%`
}

onMounted(async () => {
  await cargar()
  await cargarAvance()
  await cargarTareas()
})

watch(seguimientoTab, (tab) => {
  if (tab === 'materiales') cargarMaterialLogs()
})
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-3">
      <v-btn variant="tonal" class="mr-2" @click="router.push(`/proyectos/${id}`)">← Volver</v-btn>
      <h1 class="mb-0">Seguimiento del proyecto</h1>
    </div>
    <div class="text-medium-emphasis mb-2">ID: {{ id }}</div>
    <div v-if="proyecto" class="mb-4 text-medium-emphasis">{{ proyecto?.nombre_del_proyecto }}</div>
    <v-alert v-if="error" type="error" class="mt-3" density="compact">{{ error }}</v-alert>

    <v-tabs v-model="seguimientoTab" fixed-tabs class="mb-2">
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

    <v-row class="mt-4">
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
              <v-divider class="my-4" />
              <div>
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-medium-emphasis">Materiales</div>
                  <v-chip color="primary" variant="tonal">Avance: {{ fmtPercent(avanceMateriales?.avanceMaterialesPct ?? 0) }}</v-chip>
                </div>
                <v-progress-linear :model-value="Math.max(0, Math.min(100, avanceMateriales?.avanceMaterialesPct ?? 0))" color="primary" class="mb-3" />
                <v-data-table :items="materialesDetalle" :headers="[
                  { title: 'ID', key: 'id' },
                  { title: 'Descripción', key: 'descripcion' },
                  { title: 'Cant. total', key: 'cantidad_total' },
                  { title: 'Cant. usado', key: 'cantidad_usado' },
                  { title: 'Avance', key: 'avance_pct' },
                ]" item-key="id">
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

    <!-- Dialogos -->
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

    <v-snackbar v-model="toast.show" :color="toast.color" timeout="2500" location="top">{{ toast.message }}</v-snackbar>
  </v-container>
</template>

<style scoped>
.gap-2 { gap: 0.5rem; }
</style>