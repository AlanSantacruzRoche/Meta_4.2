<script setup>
defineProps({ players: { type: Array, default: () => [] }, rosters: { type: Array, default: () => [] }, loading: Boolean, loadError: String });
defineEmits(['open-login', 'navigate', 'reload']);
</script>

<template>
  <div class="landing-page">
    <v-app-bar color="white" elevation="1">
      <div class="d-flex align-center ga-3 ml-4"><div class="brand-mark">A</div><span class="font-weight-bold">Arena Manager</span></div>
      <v-spacer />
      <v-btn variant="text" class="mr-2 d-none d-sm-flex" @click="$emit('navigate', 'players')">Jugadores</v-btn>
      <v-btn variant="text" class="mr-2 d-none d-sm-flex" @click="$emit('navigate', 'rosters')">Rosters</v-btn>
      <v-btn color="primary" class="mr-3" prepend-icon="mdi-login" @click="$emit('open-login')">Acceso administrador</v-btn>
    </v-app-bar>
    <v-container class="py-10 py-md-16" style="max-width:1200px">
      <v-row align="center" class="mb-10">
        <v-col cols="12" md="7">
          <div class="text-overline text-primary mb-2">PLATAFORMA DE ESPORTS</div>
          <h1 class="text-h3 text-md-h2 font-weight-bold mb-4">Arena Manager</h1>
          <p class="text-h6 text-medium-emphasis font-weight-regular mb-6">Consulta jugadores y plantillas competitivas desde secciones independientes.</p>
          <div class="d-flex flex-wrap ga-3">
            <v-btn color="primary" size="large" prepend-icon="mdi-account-group" @click="$emit('navigate', 'players')">Explorar jugadores</v-btn>
            <v-btn variant="outlined" size="large" prepend-icon="mdi-shield-account" @click="$emit('navigate', 'rosters')">Explorar rosters</v-btn>
          </div>
          <p class="text-caption text-medium-emphasis mt-4">Para crear o modificar información se requiere una cuenta con permisos de administrador.</p>
        </v-col>
        <v-col cols="12" md="5">
          <v-card color="primary" variant="tonal" rounded="xl" class="pa-7">
            <v-icon size="52" class="mb-4">mdi-trophy-outline</v-icon>
            <div class="text-h5 font-weight-bold mb-2">Información pública</div>
            <p class="text-body-1 mb-0">Los perfiles y rosters se pueden consultar sin iniciar sesión. Las funciones de administración permanecen protegidas.</p>
          </v-card>
        </v-col>
      </v-row>
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }} <v-btn size="small" variant="text" @click="$emit('reload')">Reintentar</v-btn></v-alert>
      <div v-if="loading" class="d-flex align-center ga-3 py-5"><v-progress-circular indeterminate color="primary" size="22" /><span class="text-body-2 text-medium-emphasis">Cargando información...</span></div>
      <v-row>
        <v-col cols="12" sm="6"><v-card rounded="lg" class="pa-5 h-100" elevation="1"><div class="d-flex align-center justify-space-between"><span class="text-body-2 text-medium-emphasis">Jugadores registrados</span><v-avatar color="primary" variant="tonal"><v-icon>mdi-account-group</v-icon></v-avatar></div><div class="text-h3 font-weight-bold my-2">{{ players.length }}</div><v-btn variant="text" color="primary" class="px-0" append-icon="mdi-arrow-right" @click="$emit('navigate', 'players')">Ir a jugadores</v-btn></v-card></v-col>
        <v-col cols="12" sm="6"><v-card rounded="lg" class="pa-5 h-100" elevation="1"><div class="d-flex align-center justify-space-between"><span class="text-body-2 text-medium-emphasis">Rosters registrados</span><v-avatar color="secondary" variant="tonal"><v-icon>mdi-shield-account</v-icon></v-avatar></div><div class="text-h3 font-weight-bold my-2">{{ rosters.length }}</div><v-btn variant="text" color="primary" class="px-0" append-icon="mdi-arrow-right" @click="$emit('navigate', 'rosters')">Ir a rosters</v-btn></v-card></v-col>
      </v-row>
      <div class="text-center text-caption text-medium-emphasis mt-10">Arena Manager · Consulta pública de jugadores y rosters</div>
    </v-container>
  </div>
</template>
