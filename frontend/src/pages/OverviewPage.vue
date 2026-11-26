<script setup>
defineProps({ players: Array, rosters: Array, isAdmin: Boolean, loading: Boolean, loadError: String });
defineEmits(['navigate', 'reload']);
</script>

<template>
  <div>
    <div class="mb-7">
      <div class="text-overline text-primary">ESPORTS · ARENA MANAGER</div>
      <h1 class="text-h4 font-weight-bold">Resumen general</h1>
      <p class="text-body-1 text-medium-emphasis">Vista general de los jugadores y las plantillas competitivas.</p>
    </div>
    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-5" closable>
      {{ loadError }} <v-btn variant="text" size="small" @click="$emit('reload')">Reintentar</v-btn>
    </v-alert>
    <div v-if="loading" class="d-flex align-center ga-3 mb-5">
      <v-progress-circular indeterminate color="primary" size="20" />
      <span class="text-body-2 text-medium-emphasis">Actualizando información...</span>
    </div>
    <v-row class="mb-4">
      <v-col cols="12" sm="6" lg="4">
        <v-card rounded="lg" class="pa-5" elevation="1">
          <div class="d-flex align-center justify-space-between"><span class="text-body-2 text-medium-emphasis">Jugadores registrados</span><v-avatar color="primary" variant="tonal"><v-icon>mdi-account-group</v-icon></v-avatar></div>
          <div class="text-h3 font-weight-bold mt-3">{{ players.length }}</div>
          <v-btn variant="text" color="primary" class="mt-2 px-0" append-icon="mdi-arrow-right" @click="$emit('navigate', 'players')">Ver jugadores</v-btn>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <v-card rounded="lg" class="pa-5" elevation="1">
          <div class="d-flex align-center justify-space-between"><span class="text-body-2 text-medium-emphasis">Rosters registrados</span><v-avatar color="secondary" variant="tonal"><v-icon>mdi-shield-account</v-icon></v-avatar></div>
          <div class="text-h3 font-weight-bold mt-3">{{ rosters.length }}</div>
          <v-btn variant="text" color="primary" class="mt-2 px-0" append-icon="mdi-arrow-right" @click="$emit('navigate', 'rosters')">Ver rosters</v-btn>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card rounded="lg" class="pa-5 h-100" elevation="1">
          <div class="text-body-2 text-medium-emphasis">Permisos de la cuenta</div>
          <div class="text-h5 font-weight-bold mt-3">{{ isAdmin ? 'Administración completa' : 'Solo consulta' }}</div>
          <p class="text-body-2 text-medium-emphasis mt-2 mb-0">{{ isAdmin ? 'Puedes crear, editar y eliminar jugadores y rosters.' : 'Puedes consultar la información registrada.' }}</p>
        </v-card>
      </v-col>
    </v-row>
    <v-card rounded="lg" elevation="1" class="pa-5">
      <div class="text-h6 font-weight-bold mb-2">Bienvenido a Arena Manager</div>
      <p class="text-body-2 text-medium-emphasis mb-0">Utiliza el menú lateral para entrar directamente a la sección de jugadores o a la sección de rosters. Cada sección tiene su propia página.</p>
    </v-card>
  </div>
</template>
