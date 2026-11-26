<script setup>
defineProps({ user: { type: Object, required: true } });
defineEmits(['logout']);
</script>

<template>
  <v-app-bar color="white" elevation="1">
    <div class="d-flex align-center ga-3 ml-4">
      <div class="brand-mark">A</div>
      <span class="font-weight-bold">Arena Manager</span>
    </div>
    <v-spacer />
    <v-chip class="mr-3" :color="user.role === 'Admin' ? 'primary' : 'blue-grey'" variant="tonal">{{ user.role }}</v-chip>
    <span class="text-body-2 mr-3 d-none d-sm-block">{{ user.nombre }} · {{ user.email }}</span>
    <v-btn icon="mdi-logout" variant="text" class="mr-2" aria-label="Cerrar sesión" @click="$emit('logout')" />
  </v-app-bar>
</template>
