<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ProyectosService } from '../services/proyectosService'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const toast = ref({ show: false, message: '', color: 'success' })
function notify(message, color = 'success') { toast.value = { show: true, message, color } }

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

function toNumber(v) { return v === '' || v === null ? null : Number(v) }

async function crearProyecto() {
  loading.value = true
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
    notify('Proyecto creado correctamente', 'success')
    const id = res?.data?.id || res?.id
    if (id) router.push(`/proyectos/${id}`)
  } catch (e) {
    error.value = e.message
    notify(e.message, 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    fecha: '',
    nombre_del_proyecto: '',
    mina: '',
    equipo: '',
    habilitado_estimado: '',
    dias_trabajados: '',
    numeros_de_trabajadores_por_dia: '',
    numero_de_tareas_por_dia: ''
  }
}
</script>

<template>
  <div class="crear-proyecto-container">
    <!-- Header elegante -->
    <div class="header-section">
      <v-btn 
        variant="text" 
        color="primary" 
        @click="$router.push('/')"
        class="back-button"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Volver a proyectos
      </v-btn>
      
      <div class="text-h3 font-weight-light mt-4 mb-2">Crear nuevo proyecto</div>
      <div class="text-subtitle-1 text-medium-emphasis">Completa la información para crear un nuevo proyecto</div>
    </div>

    <!-- Formulario principal -->
    <v-card class="form-card" elevation="3">
      <v-card-text class="pa-8">
        <v-form @submit.prevent="crearProyecto">
          <!-- Información básica -->
          <div class="section-header">
            <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>
            <span class="text-h6">Información básica</span>
          </div>
          
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-text-field
                label="Fecha del proyecto"
                type="date"
                v-model="form.fecha"
                required
                variant="outlined"
                prepend-inner-icon="mdi-calendar"
                :rules="[v => !!v || 'La fecha es requerida']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Nombre del proyecto"
                v-model="form.nombre_del_proyecto"
                required
                variant="outlined"
                prepend-inner-icon="mdi-folder-outline"
                :rules="[v => !!v || 'El nombre es requerido']"
                counter="100"
              />
            </v-col>
          </v-row>

          <v-row class="mb-6">
            <v-col cols="12" md="6">
              <v-text-field
                label="Mina"
                v-model="form.mina"
                required
                variant="outlined"
                prepend-inner-icon="mdi-map-marker"
                :rules="[v => !!v || 'La mina es requerida']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Equipo"
                v-model="form.equipo"
                required
                variant="outlined"
                prepend-inner-icon="mdi-tools"
                :rules="[v => !!v || 'El equipo es requerido']"
              />
            </v-col>
          </v-row>

          <v-divider class="my-6" />

          <!-- Información técnica -->
          <div class="section-header">
            <v-icon color="primary" class="mr-2">mdi-calculator</v-icon>
            <span class="text-h6">Información técnica</span>
          </div>

          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-text-field
                label="Habilitado estimado"
                type="number"
                step="0.01"
                v-model="form.habilitado_estimado"
                required
                variant="outlined"
                prepend-inner-icon="mdi-currency-usd"
                suffix="USD"
                :rules="[v => !!v || 'El habilitado estimado es requerido']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Días trabajados"
                type="number"
                v-model="form.dias_trabajados"
                required
                variant="outlined"
                prepend-inner-icon="mdi-calendar-clock"
                suffix="días"
                :rules="[v => !!v || 'Los días trabajados son requeridos']"
              />
            </v-col>
          </v-row>

          <v-row class="mb-6">
            <v-col cols="12" md="6">
              <v-text-field
                label="Trabajadores por día"
                type="number"
                v-model="form.numeros_de_trabajadores_por_dia"
                required
                variant="outlined"
                prepend-inner-icon="mdi-account-group"
                suffix="personas"
                :rules="[v => !!v || 'El número de trabajadores es requerido']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Tareas por día"
                type="number"
                v-model="form.numero_de_tareas_por_dia"
                required
                variant="outlined"
                prepend-inner-icon="mdi-clipboard-list"
                suffix="tareas"
                :rules="[v => !!v || 'El número de tareas es requerido']"
              />
            </v-col>
          </v-row>

          <!-- Error alert -->
          <v-alert 
            v-if="error" 
            type="error" 
            variant="tonal" 
            class="mb-6"
            closable
            @click:close="error = ''"
          >
            <template #prepend>
              <v-icon>mdi-alert-circle</v-icon>
            </template>
            {{ error }}
          </v-alert>

          <!-- Botones de acción -->
          <div class="action-buttons">
            <v-btn
              variant="outlined"
              color="grey"
              @click="resetForm"
              :disabled="loading"
              class="mr-4"
            >
              <v-icon start>mdi-refresh</v-icon>
              Limpiar
            </v-btn>
            
            <v-btn
              variant="outlined"
              @click="$router.push('/')"
              :disabled="loading"
              class="mr-4"
            >
              <v-icon start>mdi-cancel</v-icon>
              Cancelar
            </v-btn>

            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              :loading="loading"
              size="large"
            >
              <v-icon start>mdi-plus-circle</v-icon>
              Crear proyecto
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

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
.crear-proyecto-container {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out;
}

.header-section {
  text-align: center;
  margin-bottom: 32px;
}

.back-button {
  margin-bottom: 16px;
  animation: slideInLeft 0.5s ease-out;
}

.form-card {
  border-radius: 16px !important;
  animation: slideInUp 0.6s ease-out 0.2s both;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
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
  .crear-proyecto-container {
    padding: 16px;
  }
  
  .form-card .v-card-text {
    padding: 24px !important;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-buttons .v-btn {
    width: 100%;
    margin: 0 !important;
  }
}
</style>