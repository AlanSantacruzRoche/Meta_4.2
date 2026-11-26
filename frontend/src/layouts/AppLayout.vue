<script setup>
import AppHeader from '../components/AppHeader.vue';

defineProps({ user: Object, currentPage: String, isAdmin: Boolean });
defineEmits(['navigate', 'logout']);

const links = [
  { title: 'Resumen', value: 'overview', icon: 'mdi-view-dashboard-outline' },
  { title: 'Jugadores', value: 'players', icon: 'mdi-account-group-outline' },
  { title: 'Rosters', value: 'rosters', icon: 'mdi-shield-account-outline' },
];
</script>

<template>
  <AppHeader :user="user" @logout="$emit('logout')" />
  <v-navigation-drawer permanent width="248" class="app-sidebar">
    <div class="px-5 py-5">
      <div class="text-overline text-medium-emphasis">MENÚ PRINCIPAL</div>
      <v-list nav class="mt-3" color="primary">
        <v-list-item
          v-for="link in links"
          :key="link.value"
          :active="currentPage === link.value"
          :prepend-icon="link.icon"
          :title="link.title"
          rounded="lg"
          @click="$emit('navigate', link.value)"
        />
      </v-list>
    </div>
    <template #append>
      <div class="pa-4">
        <v-divider class="mb-3" />
        <div class="text-caption text-medium-emphasis">Sesión iniciada como</div>
        <div class="text-body-2 font-weight-bold text-truncate">{{ user?.nombre }}</div>
        <v-chip size="small" class="mt-2" :color="isAdmin ? 'primary' : 'blue-grey'" variant="tonal">{{ user?.role }}</v-chip>
      </div>
    </template>
  </v-navigation-drawer>
  <v-main class="app-main">
    <v-container fluid class="pa-4 pa-md-8" style="max-width: 1500px">
      <slot />
    </v-container>
  </v-main>
</template>
