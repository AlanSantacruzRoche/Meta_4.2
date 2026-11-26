<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: Boolean, editingPlayer: Object, busy: Boolean });
const emit = defineEmits(['update:modelValue', 'save']);
const emptyForm = () => ({ nickname: '', nombre_real: '', pais: '', rol: 'Top', estado: 'activo' });
const form = reactive(emptyForm());
watch(() => [props.modelValue, props.editingPlayer], ([opened, player]) => {
  if (!opened) return;
  Object.assign(form, player ? { nickname: player.nickname, nombre_real: player.nombre_real || '', pais: player.pais || '', rol: player.rol, estado: player.estado } : emptyForm());
}, { immediate: true });
function save() { emit('save', { ...form }, props.editingPlayer); }
</script>
<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="$emit('update:modelValue', $event)">
    <v-card><v-card-title>{{ editingPlayer ? 'Editar jugador' : 'Nuevo jugador' }}</v-card-title>
      <v-card-text><v-form @submit.prevent="save">
        <v-text-field v-model="form.nickname" label="Nickname" required />
        <v-text-field v-model="form.nombre_real" label="Nombre real" />
        <v-text-field v-model="form.pais" label="País" />
        <v-select v-model="form.rol" :items="['Top', 'Jungle', 'Mid', 'ADC', 'Support']" label="Posición" required />
        <v-select v-model="form.estado" :items="['activo', 'inactivo']" label="Estado" />
      </v-form></v-card-text>
      <v-card-actions><v-spacer /><v-btn @click="$emit('update:modelValue', false)">Cancelar</v-btn><v-btn color="primary" :loading="busy" @click="save">Guardar</v-btn></v-card-actions>
    </v-card>
  </v-dialog>
</template>
