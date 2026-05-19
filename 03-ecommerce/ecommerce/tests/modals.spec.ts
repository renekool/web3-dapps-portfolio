import { test, expect } from '@playwright/test';

test.describe('Web Customer — Tareas 4 y 5', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navegar a la tienda
    await page.goto('http://127.0.0.1:7004', { waitUntil: 'networkidle' });
    
    // 2. Conectar Wallet
    const connectBtn = page.getByRole('button', { name: /Conectar Wallet/i }).first();
    await connectBtn.click();
    await expect(page.getByText(/0x/)).toBeVisible({ timeout: 15000 });

    // 3. Añadir producto
    const addBtn = page.getByRole('button', { name: 'Añadir' }).first();
    await addBtn.click();
    await expect(page.getByText(/añadido al carrito/i)).toBeVisible({ timeout: 10000 });
    
    // 4. Ir al carrito vía navegación SPA
    const cartLink = page.locator('header a[href="/cart"]');
    await cartLink.click();
    await expect(page).toHaveURL(/.*cart/);
    
    // 5. Esperar a que los elementos del carrito estén presentes (indicador de que el estado cargó)
    await expect(page.getByText('por unidad')).toBeVisible({ timeout: 15000 });
  });

  test('Tarea 4: Confirmación de Checkout', async ({ page }) => {
    // Localizar botón de pago en la Card de resumen
    const payBtn = page.getByRole('button', { name: /Confirmar y Pagar/i }).first();
    await payBtn.click();
    
    // Validar modal
    await expect(page.getByText('¿Confirmar pedido?')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Confirmar y Pagar', exact: true })).toBeVisible();
  });

  test('Tarea 5: Confirmación de Vaciar Carrito', async ({ page }) => {
    // Localizar botón de vaciar
    const clearBtn = page.getByRole('button', { name: /Vaciar mi carrito/i });
    await clearBtn.click();
    
    // Validar modal
    await expect(page.getByText('¿Vaciar carrito?')).toBeVisible({ timeout: 10000 });
    
    // Cancelar
    const cancelBtn = page.getByRole('button', { name: /Seguir comprando/i });
    await cancelBtn.click();
    await expect(page.getByText('¿Vaciar carrito?')).not.toBeVisible();
  });
});

test.describe('Web Payment Gateway — Tareas 1 y 3', () => {
  test.beforeEach(async ({ page }) => {
    const url = 'http://127.0.0.1:7002/?merchant_address=0x123&amount=100.00&invoice=INV-TEST&date=2024-04-27&redirect=http://127.0.0.1:7004';
    await page.goto(url, { waitUntil: 'networkidle' });
    
    await page.waitForFunction(() => typeof (window as any).setWalletState === 'function', { timeout: 15000 });
    await page.evaluate(() => (window as any).setWalletState('connected'));
  });

  test('Tarea 1: Modales de Error (Saldo Insuficiente)', async ({ page }) => {
    await page.evaluate(() => (window as any).setErrorSimulation('balance'));
    await expect(page.getByText('Saldo insuficiente')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText('Saldo insuficiente')).not.toBeVisible();
  });

  test('Tarea 3: Modal de Procesamiento Bloqueante', async ({ page }) => {
    const payBtn = page.getByRole('button', { name: /Pagar/i }).first();
    await payBtn.click();
    await expect(page.getByText('Procesando tu pago...')).toBeVisible({ timeout: 10000 });
    const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]');
    await expect(closeBtn).not.toBeVisible();
  });
});
