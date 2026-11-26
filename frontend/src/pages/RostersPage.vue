<script setup>
import { computed, ref } from 'vue';
import RosterList from '../components/RosterList.vue';
import RosterDialog from '../components/RosterDialog.vue';
import RosterMembersDialog from '../components/RosterMembersDialog.vue';
import { api, asList } from '../services/api.js';

const props = defineProps({ rosters: { type: Array, default: () => [] }, players: { type: Array, default: () => [] }, isAdmin: Boolean, loading: Boolean, loadError: String, csrf: String });
const emit = defineEmits(['reload', 'notify']);
const notify = (message, color) => emit('notify', message, color);

const type = ref(null);
const busy = ref(false);
const filteredRosters = computed(() => props.rosters.filter(roster => !type.value || roster.tipo === type.value));

const rosterDialog = ref(false);
const editingRoster = ref(null);
function openRoster(roster = null) { editingRoster.value = roster; rosterDialog.value = true; }

async function saveRoster(form, editing) {
  busy.value = true;
  try {
    const body = { ...form };
    if (editing) await api(`/rosters/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) }, props.csrf);
    else await api('/rosters', { method: 'POST', body: JSON.stringify(body) }, props.csrf);
    emit('reload'); notify('Roster guardado.'); rosterDialog.value = false;
  } catch (error) { notify(error.message, 'error'); }
  finally { busy.value = false; }
}
async function removeRoster(roster) {
  if (!window.confirm(`¿Eliminar el roster ${roster.nombre}?`)) return;
  try { await api(`/rosters/${roster.id}`, { method: 'DELETE', body: '{}' }, props.csrf); emit('reload'); notify('Roster eliminado.'); }
  catch (error) { notify(error.message, 'error'); }
}

/* Integrantes */
const membersDialog = ref(false);
const selectedRoster = ref(null);
const members = ref([]);
const availablePlayers = computed(() => props.players.filter(player => player.estado === 'activo' && !members.value.some(member => member.id === player.id)));

async function refreshMembers() {
  if (!selectedRoster.value) return;
  try { members.value = asList(await api(`/rosters/${selectedRoster.value.id}/jugadores`), 'jugadores'); }
  catch (error) { notify(error.message, 'error'); }
}
async function openDetails(roster) { selectedRoster.value = roster; membersDialog.value = true; await refreshMembers(); }
async function assignPlayer({ playerId, memberRole }) {
  if (!selectedRoster.value || !playerId) return;
  try {
    await api(`/rosters/${selectedRoster.value.id}/jugadores`, { method: 'POST', body: JSON.stringify({ id_jugador: Number(playerId), rol_en_roster: memberRole }) }, props.csrf);
    await refreshMembers(); emit('reload'); notify('Jugador asignado.');
  } catch (error) { notify(error.message, 'error'); }
}
async function toggleMember(member) {
  const role = member.rol_en_roster === 'Titular' ? 'Suplente' : 'Titular';
  try {
    await api(`/rosters/${selectedRoster.value.id}/jugadores/${member.id}`, { method: 'PUT', body: JSON.stringify({ rol_en_roster: role }) }, props.csrf);
    await refreshMembers(); notify('Rol actualizado.');
  } catch (error) { notify(error.message, 'error'); }
}
async function removeMember(member) {
  if (!window.confirm(`¿Quitar a ${member.nickname} del roster?`)) return;
  try {
    await api(`/rosters/${selectedRoster.value.id}/jugadores/${member.id}`, { method: 'DELETE', body: '{}' }, props.csrf);
    await refreshMembers(); emit('reload'); notify('Jugador retirado del roster.');
  } catch (error) { notify(error.message, 'error'); }
}
</script>
<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-6"><div><div class="text-overline text-primary">PLANTILLAS COMPETITIVAS</div><h1 class="text-h4 font-weight-bold">Rosters</h1><p class="text-body-1 text-medium-emphasis">Organiza equipos, temporadas e integrantes.</p></div><v-btn v-if="isAdmin" color="primary" prepend-icon="mdi-plus" @click="openRoster()">Nuevo roster</v-btn></div>
    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }} <v-btn variant="text" size="small" @click="$emit('reload')">Reintentar</v-btn></v-alert>
    <v-card rounded="lg" elevation="1" class="pa-4"><div class="d-flex flex-wrap align-center ga-3 mb-5"><v-select v-model="type" :items="['Principal', 'Academy']" label="Tipo de roster" clearable density="comfortable" hide-details style="max-width:230px" /><v-spacer /><span class="text-caption text-medium-emphasis">{{ filteredRosters.length }} roster(s)</span></div>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
      <RosterList :rosters="filteredRosters" :is-admin="isAdmin" @details="openDetails" @edit="openRoster" @remove="removeRoster" />
    </v-card>
    <RosterDialog v-model="rosterDialog" :editing-roster="editingRoster" :busy="busy" @save="saveRoster" />
    <RosterMembersDialog v-model="membersDialog" :roster="selectedRoster" :members="members" :is-admin="isAdmin" :available-players="availablePlayers" @assign="assignPlayer" @toggle-role="toggleMember" @remove="removeMember" />
  </div>
</template>
