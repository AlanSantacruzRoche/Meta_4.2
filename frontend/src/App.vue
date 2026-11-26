<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AuthView from './components/AuthView.vue';
import LandingPage from './components/LandingPage.vue';
import AppLayout from './layouts/AppLayout.vue';
import OverviewPage from './pages/OverviewPage.vue';
import PlayersPage from './pages/PlayersPage.vue';
import RostersPage from './pages/RostersPage.vue';
import { api, asList, readCookie } from './services/api.js';

const ROUTES = { home: '/', login: '/login', overview: '/panel', players: '/jugadores', rosters: '/rosters' };
const ROUTE_NAMES = Object.fromEntries(Object.entries(ROUTES).map(([name, path]) => [path, name]));
const currentPage = ref(ROUTE_NAMES[window.location.pathname] || 'home');

function navigate(name, { replace = false } = {}) {
  const page = ROUTES[name] ? name : 'home';
  const path = ROUTES[page];
  if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
  currentPage.value = page;
}
function syncRoute() {
  currentPage.value = ROUTE_NAMES[window.location.pathname] || 'home';
  if (!user.value && currentPage.value === 'overview') navigate('home', { replace: true });
  if (user.value && currentPage.value === 'login') navigate('overview', { replace: true });
}

const user = ref(null);
const players = ref([]);
const rosters = ref([]);
const loadingData = ref(false);
const loadError = ref('');
const snack = ref(false);
const snackText = ref('');
const snackColor = ref('success');

async function loadAll() {
  loadingData.value = true; loadError.value = '';
  const [playerResult, rosterResult] = await Promise.allSettled([api('/jugadores'), api('/rosters')]);
  if (playerResult.status === 'fulfilled') players.value = asList(playerResult.value, 'jugadores');
  else { players.value = []; loadError.value = `No se pudieron cargar los jugadores: ${playerResult.reason?.message || 'error desconocido'}`; }
  if (rosterResult.status === 'fulfilled') rosters.value = asList(rosterResult.value, 'rosters');
  else {
    rosters.value = [];
    const message = `No se pudieron cargar los rosters: ${rosterResult.reason?.message || 'error desconocido'}`;
    loadError.value = loadError.value ? `${loadError.value} · ${message}` : message;
  }
  loadingData.value = false;
}
function notify(message, color = 'success') { snackText.value = message; snackColor.value = color; snack.value = true; }

const csrf = ref('');
const authError = ref('');
const busy = ref(false);
const isAdmin = computed(() => user.value?.role === 'Admin');
const authenticated = computed(() => Boolean(user.value));
const publicDataPage = computed(() => !authenticated.value && ['players', 'rosters'].includes(currentPage.value));

async function authenticate(path, details) {
  busy.value = true; authError.value = '';
  try {
    const result = await api(path, { method: 'POST', body: JSON.stringify(details) });
    user.value = result.user; csrf.value = result.csrfToken;
    await loadAll(); navigate('overview', { replace: true }); return true;
  } catch (error) { authError.value = error.message; return false; }
  finally { busy.value = false; }
}
const login = credentials => authenticate('/auth/login', credentials);
const register = details => authenticate('/auth/register', details);
function loginWithGoogle() { window.location.assign('/api/v1/auth/google/login'); }
async function logout() {
  try { await api('/auth/logout', { method: 'POST', body: '{}' }, csrf.value); } catch { /* La sesión pudo expirar. */ }
  user.value = null; csrf.value = ''; navigate('home', { replace: true });
}
async function checkSession() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('oauth_error')) authError.value = params.get('oauth_error');
  try {
    const result = await api('/auth/me');
    user.value = result.user; csrf.value = readCookie('csrf_token');
    if (['home', 'login'].includes(currentPage.value)) navigate('overview', { replace: true });
  } catch {
    user.value = null;
    if (params.get('oauth') === 'success') authError.value = 'Google autenticó la cuenta, pero no se pudo recuperar la sesión. Intenta nuevamente.';
    if (currentPage.value === 'overview') navigate('home', { replace: true });
  }
  if (params.has('oauth') || params.has('oauth_error')) window.history.replaceState({}, document.title, window.location.pathname);
  await loadAll();
}

onMounted(() => { window.addEventListener('popstate', syncRoute); checkSession(); });
onUnmounted(() => window.removeEventListener('popstate', syncRoute));
</script>
<template>
  <v-app>
    <LandingPage v-if="currentPage === 'home' && !authenticated"
      :players="players" :rosters="rosters" :loading="loadingData" :load-error="loadError"
      @open-login="navigate('login')" @navigate="navigate" @reload="loadAll" />

    <AuthView v-else-if="currentPage === 'login' && !authenticated"
      :busy="busy" :error="authError"
      @login="login" @register="register" @google-login="loginWithGoogle" @back="navigate('home')" />

    <template v-else-if="authenticated">
      <AppLayout :user="user" :is-admin="isAdmin" :current-page="currentPage" @navigate="navigate" @logout="logout">
        <OverviewPage v-if="currentPage === 'overview'" :players="players" :rosters="rosters" :is-admin="isAdmin" :loading="loadingData" :load-error="loadError" @navigate="navigate" @reload="loadAll" />
        <PlayersPage v-else-if="currentPage === 'players'" :players="players" :is-admin="isAdmin" :csrf="csrf" :loading="loadingData" :load-error="loadError" @reload="loadAll" @notify="notify" />
        <RostersPage v-else-if="currentPage === 'rosters'" :rosters="rosters" :players="players" :is-admin="isAdmin" :csrf="csrf" :loading="loadingData" :load-error="loadError" @reload="loadAll" @notify="notify" />
      </AppLayout>
    </template>

    <template v-else-if="publicDataPage">
      <v-app-bar color="white" elevation="1"><div class="d-flex align-center ga-3 ml-4"><div class="brand-mark">A</div><span class="font-weight-bold">Arena Manager</span></div><v-spacer /><v-btn variant="text" class="mr-2" @click="navigate('home')">Inicio</v-btn><v-btn color="primary" class="mr-3" @click="navigate('login')">Acceso administrador</v-btn></v-app-bar>
      <v-main class="app-main"><v-container fluid class="pa-4 pa-md-8" style="max-width:1500px">
        <PlayersPage v-if="currentPage === 'players'" :players="players" :is-admin="false" :loading="loadingData" :load-error="loadError" @reload="loadAll" />
        <RostersPage v-else :rosters="rosters" :players="players" :is-admin="false" :loading="loadingData" :load-error="loadError" @reload="loadAll" />
      </v-container></v-main>
    </template>
    <v-snackbar v-model="snack" :color="snackColor" timeout="3500">{{ snackText }}</v-snackbar>
  </v-app>
</template>
