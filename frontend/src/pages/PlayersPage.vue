<script setup>
import { computed, ref } from 'vue';
import PlayerTable from '../components/PlayerTable.vue';
import PlayerDialog from '../components/PlayerDialog.vue';
import { api } from '../services/api.js';

const props = defineProps({ players: { type: Array, default: () => [] }, isAdmin: Boolean, loading: Boolean, loadError: String, csrf: String });
const emit = defineEmits(['reload', 'notify']);
const notify = (message, color) => emit('notify', message, color);

const search = ref('');
const role = ref(null);
const busy = ref(false);
const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const filteredPlayers = computed(() => props.players.filter(player =>
  (!search.value || String(player.nickname ?? '').toLowerCase().includes(search.value.toLowerCase())) &&
  (!role.value || player.rol === role.value)));

const dialog = ref(false);
const editingPlayer = ref(null);
function openPlayer(player = null) { editingPlayer.value = player; dialog.value = true; }

async function savePlayer(form, editing) {
  busy.value = true;
  const body = { ...form, nombre_real: form.nombre_real || null, pais: form.pais || null };
  try {
    if (editing) await api(`/jugadores/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) }, props.csrf);
    else await api('/jugadores', { method: 'POST', body: JSON.stringify(body) }, props.csrf);
    emit('reload'); notify('Jugador guardado.'); dialog.value = false;
  } catch (error) { notify(error.message, 'error'); }
  finally { busy.value = false; }
}
async function removePlayer(player) {
  if (!window.confirm(`¿Eliminar al jugador ${player.nickname}?`)) return;
  try { await api(`/jugadores/${player.id}`, { method: 'DELETE', body: '{}' }, props.csrf); emit('reload'); notify('Jugador eliminado.'); }
  catch (error) { notify(error.message, 'error'); }
}
</script>
<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-6"><div><div class="text-overline text-primary">DIRECTORIO</div><h1 class="text-h4 font-weight-bold">Jugadores</h1><p class="text-body-1 text-medium-emphasis">Consulta y administra los perfiles de los jugadores.</p></div><v-btn v-if="isAdmin" color="primary" prepend-icon="mdi-plus" @click="openPlayer()">Nuevo jugador</v-btn></div>
    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }} <v-btn variant="text" size="small" @click="$emit('reload')">Reintentar</v-btn></v-alert>
    <v-card rounded="lg" elevation="1"><div class="d-flex flex-wrap align-center ga-3 pa-4">
      <v-text-field v-model="search" label="Buscar por nickname" prepend-inner-icon="mdi-magnify" density="comfortable" hide-details clearable style="max-width:360px" />
      <v-select v-model="role" :items="roles" label="Posición" clearable density="comfortable" hide-details style="max-width:200px" /><v-spacer /><span class="text-caption text-medium-emphasis">{{ filteredPlayers.length }} resultado(s)</span>
    </div><v-divider /><div v-if="loading" class="pa-5"><v-progress-linear indeterminate color="primary" /></div><div class="pa-4"><PlayerTable :players="filteredPlayers" :is-admin="isAdmin" @edit="openPlayer" @remove="removePlayer" /></div></v-card>
    <PlayerDialog v-model="dialog" :editing-player="editingPlayer" :busy="busy" @save="savePlayer" />
  </div>
</template>
