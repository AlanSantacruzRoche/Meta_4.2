<script setup>
defineProps({ players: Array, isAdmin: Boolean });
defineEmits(['edit', 'remove']);
</script>

<template>
  <div class="table-wrap">
    <table data-testid="players-table" class="players-table">
      <thead><tr><th>Jugador</th><th>Posición</th><th>País</th><th>Estado</th><th v-if="isAdmin">Acciones</th></tr></thead>
      <tbody>
        <tr v-for="player in players" :key="player.id">
          <td>
            <div class="font-weight-bold">{{ player.nickname }}</div>
            <div class="text-caption text-medium-emphasis">{{ player.nombre_real || 'Sin nombre real' }}</div>
          </td>
          <td><v-chip size="small" variant="tonal">{{ player.rol }}</v-chip></td>
          <td>{{ player.pais || '—' }}</td>
          <td><v-chip size="small" :color="player.estado === 'activo' ? 'success' : 'grey'" variant="tonal">{{ player.estado }}</v-chip></td>
          <td v-if="isAdmin">
            <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Editar jugador" @click="$emit('edit', player)" />
            <v-btn icon="mdi-delete" size="small" color="error" variant="text" aria-label="Eliminar jugador" @click="$emit('remove', player)" />
          </td>
        </tr>
        <tr v-if="!players.length"><td :colspan="isAdmin ? 5 : 4" class="text-center text-medium-emphasis py-8">No hay jugadores para mostrar.</td></tr>
      </tbody>
    </table>
  </div>
</template>
