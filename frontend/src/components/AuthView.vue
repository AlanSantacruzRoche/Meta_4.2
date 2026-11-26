<script setup>
import { reactive, ref } from 'vue';
defineProps({ busy: Boolean, error: String });
const emit = defineEmits(['login', 'register', 'google-login', 'back']);
const authTab = ref('login');
const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ nombre: '', email: '', password: '' });
</script>

<template>
  <section class="login-shell d-flex align-center justify-center pa-4">
    <v-card width="470" rounded="lg" elevation="4" class="pa-5">
      <div class="d-flex align-center justify-space-between mb-5">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="$emit('back')">Volver al inicio</v-btn>
      </div>
      <div class="d-flex align-center ga-3 mb-5">
        <div class="brand-mark">A</div>
        <div>
          <div class="text-h5 font-weight-bold">Arena Manager</div>
          <div class="text-caption text-medium-emphasis">Gestión de jugadores y rosters</div>
        </div>
      </div>

      <v-tabs v-model="authTab" grow color="primary">
        <v-tab value="login">Iniciar sesión</v-tab>
        <v-tab value="register">Crear cuenta</v-tab>
      </v-tabs>

      <v-window :model-value="authTab" class="mt-4">
        <v-window-item value="login">
          <v-form @submit.prevent="emit('login', { ...loginForm })">
            <v-text-field v-model="loginForm.email" label="Correo electrónico" type="email" autocomplete="username" required />
            <v-text-field v-model="loginForm.password" label="Contraseña" type="password" autocomplete="current-password" required />
            <v-btn type="submit" color="primary" block size="large" :loading="busy">Entrar</v-btn>
          </v-form>
          <div class="d-flex align-center my-4">
            <v-divider />
            <span class="text-caption text-medium-emphasis px-3">o continúa con</span>
            <v-divider />
          </div>
          <v-btn block variant="outlined" size="large" :disabled="busy" @click="$emit('google-login')">
            <v-icon start>mdi-google</v-icon>
            Continuar con Google
          </v-btn>
        </v-window-item>
        <v-window-item value="register">
          <v-form @submit.prevent="emit('register', { ...registerForm })">
            <v-text-field v-model="registerForm.nombre" label="Nombre" required />
            <v-text-field v-model="registerForm.email" label="Correo electrónico" type="email" autocomplete="username" required />
            <v-text-field v-model="registerForm.password" label="Contraseña (mínimo 8 caracteres)" type="password" minlength="8" required />
            <v-btn type="submit" color="primary" block size="large" :loading="busy">Crear cuenta</v-btn>
          </v-form>
          <div class="d-flex align-center my-4">
            <v-divider />
            <span class="text-caption text-medium-emphasis px-3">o continúa con</span>
            <v-divider />
          </div>
          <v-btn block variant="outlined" size="large" :disabled="busy" @click="$emit('google-login')">
            <v-icon start>mdi-google</v-icon>
            Registrarme con Google
          </v-btn>
          <p class="text-caption text-medium-emphasis mt-3">Las cuentas nuevas tienen permisos de consulta.</p>
        </v-window-item>
      </v-window>

      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mt-4">{{ error }}</v-alert>
      <p class="text-caption text-medium-emphasis mt-5 mb-0">El rol de administrador solo se asigna desde la configuración del servidor.</p>
    </v-card>
  </section>
</template>
