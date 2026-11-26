<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ modelValue: Boolean, roster: Object, members: Array, isAdmin: Boolean, availablePlayers: Array });
const emit = defineEmits(['update:modelValue', 'assign', 'toggle-role', 'remove']);
const playerId = ref(null);
const memberRole = ref('Titular');
watch(() => props.modelValue, opened => { if (opened) { playerId.value = null; memberRole.value = 'Titular'; } });
function assign() { emit('assign', { playerId: playerId.value, memberRole: memberRole.value }); playerId.value = null; }
</script>
<template>
  <v-dialog :model-value="modelValue" max-width="760" data-testid="roster-members-dialog" @update:model-value="$emit('update:modelValue', $event)">
    <v-card><v-card-title>{{ roster?.nombre }} · Integrantes</v-card-title><v-card-text>
      <v-list v-if="members.length"><v-list-item v-for="member in members" :key="member.id" :title="member.nickname" :subtitle="`${member.rol} · ${member.pais || 'País no especificado'}`">
        <template #append><v-chip size="small" class="mr-2" :color="member.rol_en_roster === 'Titular' ? 'success' : 'default'">{{ member.rol_en_roster }}</v-chip>
          <template v-if="isAdmin"><v-btn size="small" variant="text" @click="$emit('toggle-role', member)">{{ member.rol_en_roster === 'Titular' ? 'A suplente' : 'A titular' }}</v-btn><v-btn size="small" icon="mdi-close" color="error" variant="text" aria-label="Quitar jugador" @click="$emit('remove', member)" /></template>
        </template>
      </v-list-item></v-list><p v-else class="text-medium-emphasis py-5">Este roster todavía no tiene integrantes.</p>
      <template v-if="isAdmin"><v-divider class="my-3" /><div class="d-flex flex-wrap ga-2 align-center">
        <v-select v-model="playerId" :items="availablePlayers" item-title="nickname" item-value="id" data-testid="available-player-select" label="Jugador disponible" density="compact" hide-details style="min-width:220px" />
        <v-select v-model="memberRole" :items="['Titular', 'Suplente']" label="Asignar como" density="compact" hide-details style="max-width:150px" />
        <v-btn color="primary" :disabled="!playerId" @click="assign">Asignar</v-btn>
      </div></template>
    </v-card-text><v-card-actions><v-spacer /><v-btn @click="$emit('update:modelValue', false)">Cerrar</v-btn></v-card-actions></v-card>
  </v-dialog>
</template>
