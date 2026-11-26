<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: Boolean, editingRoster: Object, busy: Boolean });
const emit = defineEmits(['update:modelValue', 'save']);
const emptyForm = () => ({ nombre: '', juego: 'League of Legends', tipo: 'Principal', temporada: String(new Date().getFullYear()) });
const form = reactive(emptyForm());
watch(() => [props.modelValue, props.editingRoster], ([opened, roster]) => {
  if (!opened) return;
  Object.assign(form, roster ? { nombre: roster.nombre, juego: roster.juego, tipo: roster.tipo, temporada: String(roster.temporada) } : emptyForm());
}, { immediate: true });
function save() { emit('save', { ...form }, props.editingRoster); }
</script>
<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="$emit('update:modelValue', $event)">
    <v-card><v-card-title>{{ editingRoster ? 'Editar roster' : 'Nuevo roster' }}</v-card-title>
      <v-card-text><v-form @submit.prevent="save">
        <v-text-field v-model="form.nombre" label="Nombre" required />
        <v-text-field v-model="form.juego" label="Juego" />
        <v-select v-model="form.tipo" :items="['Principal', 'Academy']" label="Tipo" />
        <v-text-field v-model="form.temporada" label="Temporada" required />
      </v-form></v-card-text>
      <v-card-actions><v-spacer /><v-btn @click="$emit('update:modelValue', false)">Cancelar</v-btn><v-btn color="primary" :loading="busy" @click="save">Guardar</v-btn></v-card-actions>
    </v-card>
  </v-dialog>
</template>
