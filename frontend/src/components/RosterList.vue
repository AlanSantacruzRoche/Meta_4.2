<script setup>
defineProps({ rosters: Array, isAdmin: Boolean, showDetails: { type: Boolean, default: true } });
defineEmits(['details', 'edit', 'remove']);
</script>

<template>
  <div>
    <v-row>
      <v-col v-for="roster in rosters" :key="roster.id" cols="12" md="6" lg="4">
        <v-card rounded="lg" class="h-100" data-testid="roster-card">
          <v-card-item>
            <template #prepend><v-avatar color="primary" variant="tonal"><v-icon>mdi-shield-account</v-icon></v-avatar></template>
            <v-card-title>{{ roster.nombre }}</v-card-title>
            <v-card-subtitle>{{ roster.juego }}</v-card-subtitle>
            <template #append><v-chip size="small" variant="tonal">{{ roster.tipo }}</v-chip></template>
          </v-card-item>
          <v-card-text>
            <div class="text-body-2">Temporada {{ roster.temporada }}</div>
            <div class="text-caption text-medium-emphasis">{{ roster.cantidad_jugadores || 0 }} integrantes</div>
          </v-card-text>
          <v-card-actions>
            <v-btn v-if="showDetails" variant="text" color="primary" @click="$emit('details', roster)">Ver integrantes</v-btn>
            <v-spacer />
            <template v-if="isAdmin">
              <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Editar roster" @click="$emit('edit', roster)" />
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" aria-label="Eliminar roster" @click="$emit('remove', roster)" />
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <p v-if="!rosters.length" class="text-center text-medium-emphasis py-8">No hay rosters para mostrar.</p>
  </div>
</template>
