import { test, expect } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@esports.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'Cambia_Esta_Clave_123!';

async function openLogin(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Acceso administrador' }).click();
}

async function adminLogin(page) {
  await openLogin(page);
  await page.getByLabel('Correo electrónico').first().fill(adminEmail);
  await page.getByLabel('Contraseña').first().fill(adminPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Resumen general')).toBeVisible();
  await expect(page.getByText('Administración completa')).toBeVisible();
}

test('página principal: muestra información pública y solicita acceso para administrar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Arena Manager' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Acceso administrador' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuevo roster' })).toHaveCount(0);
});

test('autenticación: rechaza credenciales incorrectas', async ({ page }) => {
  await openLogin(page);
  await page.getByLabel('Correo electrónico').first().fill('no-existe@example.test');
  await page.getByLabel('Contraseña').first().fill('Incorrecta123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
});

test('registro local: crea un usuario Public con acceso de solo lectura', async ({ page }) => {
  const email = `public-${Date.now()}@example.test`;
  await openLogin(page);
  await page.getByRole('tab', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill('Usuario de prueba');
  const registerPanel = page.locator('.v-window-item--active');
  await registerPanel.getByLabel('Correo electrónico').fill(email);
  await registerPanel.getByLabel(/Contraseña/).fill('Public12345');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText('Resumen general')).toBeVisible();
  await expect(page.getByText('Solo consulta')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo jugador' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuevo roster' })).toHaveCount(0);
  const forbidden = await page.evaluate(async () => {
    const response = await fetch('/api/v1/jugadores', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': decodeURIComponent(document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=').slice(1).join('=') || '') }, body: JSON.stringify({ nickname: 'public-no-write', rol: 'Top' }) });
    return response.status;
  });
  expect(forbidden).toBe(403);
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(1);
});

test('Admin: CRUD de jugadores, CRUD de rosters y asignación de integrantes', async ({ page }) => {
  await adminLogin(page);
  const nickname = `PWPlayer${Date.now()}`;
  await page.getByRole('button', { name: 'Nuevo jugador' }).click();
  const playerDialog = page.getByRole('dialog');
  await playerDialog.getByLabel('Nickname').fill(nickname);
  await playerDialog.getByLabel('Nombre real').fill('Playwright Test');
  await playerDialog.getByLabel('País').fill('México');
  await playerDialog.locator('.v-select').first().click();
  await page.getByRole('option', { name: 'Top' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText(nickname)).toBeVisible();

  const rosterName = `PWRoster${Date.now()}`;
  await page.getByRole('button', { name: 'Rosters' }).click();
  await page.getByRole('button', { name: 'Nuevo roster' }).click();
  const rosterDialog = page.getByRole('dialog');
  await rosterDialog.getByLabel('Nombre').fill(rosterName);
  await rosterDialog.getByLabel('Juego').fill('League of Legends');
  await rosterDialog.getByLabel('Temporada').fill('2026');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Roster guardado correctamente.')).toBeVisible();
  const rosterCard = page.getByTestId('roster-card').filter({ hasText: rosterName });
  await expect(rosterCard).toHaveCount(1);
  await expect(rosterCard).toBeVisible();
  await rosterCard.getByRole('button', { name: 'Ver integrantes' }).click();

  // Espera el diálogo de integrantes y localiza el v-select por un test id estable.
  const membersDialog = page.getByTestId('roster-members-dialog');
  await expect(membersDialog).toBeVisible();
  const availablePlayerSelect = membersDialog.getByTestId('available-player-select');
  await expect(availablePlayerSelect).toBeVisible();
  await availablePlayerSelect.locator('input').click();

  // El menú de opciones de Vuetify se teletransporta fuera del diálogo.
  const playerOption = page.getByRole('option', { name: new RegExp(nickname) });
  await expect(playerOption).toBeVisible();
  await playerOption.click();

  await membersDialog.getByRole('button', { name: 'Asignar' }).click();
  await expect(page.getByText(nickname).last()).toBeVisible();
  await page.getByRole('button', { name: 'A suplente' }).click();
  await expect(page.getByText('Suplente').last()).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Quitar jugador' }).click();
  await expect(page.getByText('Este roster todavía no tiene integrantes.')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await rosterCard.getByRole('button', { name: 'Editar roster' }).click();
  await page.getByRole('dialog').getByLabel('Nombre').fill(`${rosterName} Editado`);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText(`${rosterName} Editado`)).toBeVisible();

  await page.getByRole('button', { name: 'Jugadores' }).click();
  const row = page.locator('tr').filter({ hasText: nickname });
  await row.getByRole('button', { name: 'Editar jugador' }).click();
  await page.getByRole('dialog').getByLabel('Nombre real').fill('Playwright Editado');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Playwright Editado')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Eliminar jugador' }).click();
  await expect(page.getByText(nickname)).toHaveCount(0);

  await page.getByRole('button', { name: 'Rosters' }).click();
  const editedCard = page.getByTestId('roster-card').filter({ hasText: `${rosterName} Editado` });
  await expect(editedCard).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await editedCard.getByRole('button', { name: 'Eliminar roster' }).click();
  await expect(page.getByText(`${rosterName} Editado`)).toHaveCount(0);
});

test('seguridad: las mutaciones sin token CSRF son rechazadas', async ({ page }) => {
  await adminLogin(page);
  const result = await page.evaluate(async () => {
    const response = await fetch('/api/v1/jugadores', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: 'csrf-no-token', rol: 'Top' }) });
    return { status: response.status, body: await response.json() };
  });
  expect(result.status).toBe(403);
  expect(result.body.error).toContain('CSRF');
});

test('cierre de sesión invalida el acceso al panel', async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Acceso administrador' })).toBeVisible();
});
