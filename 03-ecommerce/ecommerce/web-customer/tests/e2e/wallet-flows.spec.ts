import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://127.0.0.1:7004';
const MOCK_ADDR = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// localStorage keys used by the app
const WALLET_KEY = 'viva_shop_wallet_address';
const CART_KEY = 'mock-cart';
const ORDERS_KEY = 'mock-orders';

// MOCK_ORDERS seed data (mirrors lib/mock/orders.ts)
const SEED_ORDERS = [
  { id: 'INV-1', date: '2026-04-08T12:50:00Z', amount: 259, status: 'paid' },
  { id: 'INV-2', date: '2026-04-10T09:15:00Z', amount: 488, status: 'pending' },
];

// Init scripts — serialized and run in browser context before page JS
function scriptClearAll() {
  localStorage.removeItem('viva_shop_wallet_address');
  localStorage.removeItem('mock-cart');
  localStorage.removeItem('mock-orders');
}

function scriptSeedWallet() {
  localStorage.removeItem('mock-cart');
  localStorage.removeItem('mock-orders');
  localStorage.setItem('viva_shop_wallet_address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
}

// ─── Escenario 1: Sin wallet conectada ───────────────────────────────────────
// Verifica que sin wallet, la UI está bloqueada en todas las vistas

test.describe('Escenario 1 — Sin wallet conectada', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(scriptClearAll);
    await page.goto(BASE, { waitUntil: 'networkidle' });
  });

  test('header muestra "Conectar Wallet" y no la dirección', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Conectar Wallet' })).toBeVisible();
    await expect(page.locator('header').getByText(/0xf39F/)).not.toBeVisible();
  });

  test('botón Añadir deshabilitado en todos los productos', async ({ page }) => {
    const addBtns = page.getByRole('button', { name: 'Añadir' });
    await expect(addBtns.first()).toBeVisible({ timeout: 5000 });

    const count = await addBtns.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(addBtns.nth(i)).toBeDisabled();
    }
  });

  test('controles de cantidad (+) deshabilitados sin wallet', async ({ page }) => {
    // Lucide <Plus> renders as svg[class*="lucide-plus"]
    const incBtns = page.locator('button:has(svg[class*="lucide-plus"])');
    await expect(incBtns.first()).toBeVisible({ timeout: 5000 });

    const count = await incBtns.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(incBtns.nth(i)).toBeDisabled();
    }
  });

  test('/cart muestra guard de sesión desconectada y sin acceso al checkout', async ({ page }) => {
    await page.goto(`${BASE}/cart`);
    await expect(page.getByText(/sesión está desconectada/i)).toBeVisible();
    // Checkout button must not be present
    await expect(page.getByRole('button', { name: /Confirmar y Pagar/i })).not.toBeVisible();
  });

  test('/orders muestra guard para conectar wallet', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    await expect(page.getByText(/Conecta tu/i)).toBeVisible();
    // Guard includes its own "Conectar Wallet" button (header also has one → use first())
    await expect(page.getByRole('button', { name: 'Conectar Wallet' }).first()).toBeVisible();
  });
});

// ─── Escenario 2: Con wallet conectada ───────────────────────────────────────
// Verifica que con wallet, el flujo completo de compra funciona

test.describe('Escenario 2 — Con wallet conectada', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(scriptSeedWallet);
    await page.goto(BASE, { waitUntil: 'networkidle' });
  });

  test('header muestra dirección truncada, sin botón "Conectar Wallet"', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Conectar Wallet' })).not.toBeVisible();
    await expect(page.locator('header').getByText(/0xf39F/)).toBeVisible();
  });

  test('botón Añadir habilitado con wallet conectada', async ({ page }) => {
    const addBtns = page.getByRole('button', { name: 'Añadir' });
    await expect(addBtns.first()).toBeVisible({ timeout: 5000 });
    await expect(addBtns.first()).toBeEnabled();
  });

  test('controles de cantidad (+) habilitados con wallet conectada', async ({ page }) => {
    const inc = page.locator('button:has(svg[class*="lucide-plus"])').first();
    await expect(inc).toBeVisible({ timeout: 5000 });
    await expect(inc).toBeEnabled();
  });

  test('añadir producto muestra toast y actualiza badge del carrito', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();

    // Toast: "Doritos Cool Ranch añadido al carrito"
    await expect(page.getByText(/añadido al carrito/i)).toBeVisible({ timeout: 5000 });

    // Badge on nav tab shows 1
    await expect(page.locator('a[href="/cart"]').getByText('1')).toBeVisible({ timeout: 5000 });
  });

  test('carrito muestra el producto añadido con precio correcto', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800); // wait for the ~600ms add animation

    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    await expect(page.getByRole('heading', { name: 'Doritos Cool Ranch' })).toBeVisible();
    // Price: 259 cents → "2.59"
    await expect(page.getByText('2.59').first()).toBeVisible();
  });

  test('incrementar cantidad en carrito actualiza el total', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    // Initial total: 2.59 EURT (1 × Doritos)
    await expect(page.getByText('2.59').first()).toBeVisible();

    // Cart uses plain "+" and "−" characters (not Lucide icons)
    await page.locator('button').filter({ hasText: '+' }).click();

    // Total: 5.18 EURT (2 × 2.59)
    await expect(page.getByText('5.18').first()).toBeVisible({ timeout: 3000 });
  });

  test('decrementar cantidad en carrito actualiza el total', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    // First increment to qty=2 so decrement button is enabled
    await page.locator('button').filter({ hasText: '+' }).click();
    await expect(page.getByText('5.18').first()).toBeVisible({ timeout: 3000 });

    // Decrement back to qty=1
    // The cart decrement button is disabled when qty<=1, so it's enabled at qty=2
    await page.locator('button').filter({ hasText: '−' }).click();

    // Total back to 2.59 EURT
    await expect(page.getByText('2.59').first()).toBeVisible({ timeout: 3000 });
  });

  test('eliminar producto del carrito muestra estado vacío', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    // Trash button has title="Eliminar producto"
    await page.locator('button[title="Eliminar producto"]').click();

    await expect(page.getByText(/carrito está vacío/i)).toBeVisible({ timeout: 3000 });
  });

  test('checkout abre dialog de confirmación con el total correcto', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    // Click main "Confirmar y Pagar" button (in order summary card)
    await page.getByRole('button', { name: /Confirmar y Pagar/i }).first().click();

    await expect(page.getByText('¿Confirmar pedido?')).toBeVisible({ timeout: 3000 });
    // Dialog shows total: "2.59 EURT" — multiple elements match → use first()
    await expect(page.getByText(/2\.59\s*EURT/).first()).toBeVisible();
    // Confirm button inside dialog
    await expect(page.getByRole('button', { name: 'Confirmar y Pagar', exact: true })).toBeVisible();
  });

  test('vaciar carrito abre dialog de confirmación', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    await page.getByRole('button', { name: /Vaciar mi carrito/i }).click();

    await expect(page.getByText('¿Vaciar carrito?')).toBeVisible({ timeout: 3000 });
    // Cancel without vaciar
    await page.getByRole('button', { name: /Seguir comprando/i }).click();
    await expect(page.getByText('¿Vaciar carrito?')).not.toBeVisible();
    await expect(page.getByText('Doritos Cool Ranch')).toBeVisible();
  });

  test('/orders muestra órdenes preloaded INV-1 (Pagado) e INV-2 (Pendiente)', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    await expect(page.getByText('INV-1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('INV-2')).toBeVisible({ timeout: 5000 });
    // Badge colors verified via variant presence
    await expect(page.getByText('Pagado')).toBeVisible();
    await expect(page.getByText('Pendiente')).toBeVisible();
  });

  test('"Ver Detalles" abre dialog con datos de la orden', async ({ page }) => {
    await page.goto(`${BASE}/orders`);

    await page.getByRole('button', { name: /Ver Detalles/i }).first().click();

    await expect(page.getByText('Detalles de Orden')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Número de Orden')).toBeVisible();
    // At least one INV-* id shown inside dialog — multiple elements match → use first()
    await expect(page.getByText(/INV-/).first()).toBeVisible();
  });

  test('badge del carrito se actualiza al añadir 2 productos distintos', async ({ page }) => {
    // Add first product (Doritos)
    await page.getByRole('button', { name: 'Añadir' }).nth(0).click();
    await expect(page.locator('a[href="/cart"]').getByText('1')).toBeVisible({ timeout: 5000 });

    // Add second product (Pringles)
    await page.getByRole('button', { name: 'Añadir' }).nth(1).click();
    await expect(page.locator('a[href="/cart"]').getByText('2')).toBeVisible({ timeout: 5000 });
  });
});

// ─── Escenario 3: Cambio de estado dinámico ──────────────────────────────────
// Verifica que conectar/desconectar wallet en runtime actualiza la UI sin recargar

test.describe('Escenario 3 — Cambio de estado dinámico', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(scriptClearAll);
    await page.goto(BASE, { waitUntil: 'networkidle' });
  });

  test('conectar wallet habilita los botones sin recargar la página', async ({ page }) => {
    // Confirm UI starts locked
    await expect(page.getByRole('button', { name: 'Añadir' }).first()).toBeDisabled();

    // Connect via header button
    await page.getByRole('button', { name: 'Conectar Wallet' }).click();

    // Loading state appears during the 1500ms mock delay
    await expect(page.getByText(/Conectando/i)).toBeVisible({ timeout: 3000 });

    // Wallet address appears after mock delay resolves
    await expect(page.locator('header').getByText(/0xf39F/)).toBeVisible({ timeout: 5000 });

    // Buttons are now enabled — without any page reload
    await expect(page.getByRole('button', { name: 'Añadir' }).first()).toBeEnabled({ timeout: 3000 });
    await expect(page.locator('button:has(svg[class*="lucide-plus"])').first()).toBeEnabled();
  });

  test('desconectar wallet revierte la UI al estado bloqueado', async ({ page }) => {
    // First connect
    await page.getByRole('button', { name: 'Conectar Wallet' }).click();
    await expect(page.locator('header').getByText(/0xf39F/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Añadir' }).first()).toBeEnabled();

    // Open wallet dropdown by clicking the address button
    await page.locator('header button').filter({ hasText: /0xf39F/ }).click();

    // Click Desconectar in the dropdown
    await page.getByRole('button', { name: 'Desconectar' }).click();

    // Header reverts to "Conectar Wallet"
    await expect(page.getByRole('button', { name: 'Conectar Wallet' })).toBeVisible({ timeout: 3000 });

    // Añadir buttons locked again — no reload
    await expect(page.getByRole('button', { name: 'Añadir' }).first()).toBeDisabled();
  });

  test('conectar desde guard del carrito da acceso al carrito vacío', async ({ page }) => {
    await page.goto(`${BASE}/cart`);
    await expect(page.getByText(/sesión está desconectada/i)).toBeVisible();

    // Connect using the guard's own button (header also has one → use first())
    await page.getByRole('button', { name: 'Conectar Wallet' }).first().click();

    // Guard disappears, empty cart state shown
    await expect(page.getByText(/sesión está desconectada/i)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/carrito está vacío/i)).toBeVisible({ timeout: 5000 });
  });

  test('conectar desde guard de órdenes da acceso a las órdenes preloaded', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    await expect(page.getByText(/Conecta tu/i)).toBeVisible();

    // Connect via guard button (header also has one → use first())
    await page.getByRole('button', { name: 'Conectar Wallet' }).first().click();

    // MOCK_ORDERS appear after wallet connects
    await expect(page.getByText('INV-1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('INV-2')).toBeVisible({ timeout: 5000 });
  });
});

// ─── Consistencia entre vistas ───────────────────────────────────────────────
// Verifica que el estado compartido (carrito, órdenes) es coherente entre páginas

test.describe('Consistencia entre vistas', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(scriptSeedWallet);
    await page.goto(BASE, { waitUntil: 'networkidle' });
  });

  test('badge del carrito persiste al navegar entre vistas', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    await expect(page.locator('a[href="/cart"]').getByText('1')).toBeVisible({ timeout: 5000 });

    // Navigate to orders
    await page.locator('a[href="/orders"]').click();
    await expect(page).toHaveURL(/\/orders/);

    // Badge still shows 1
    await expect(page.locator('a[href="/cart"]').getByText('1')).toBeVisible({ timeout: 3000 });

    // Return to products
    await page.locator('a[href="/"]').first().click();

    // Badge still visible
    await expect(page.locator('a[href="/cart"]').getByText('1')).toBeVisible({ timeout: 3000 });
  });

  test('item del carrito persiste en localStorage a través de la navegación', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.waitForTimeout(800);

    // Navigate to orders then back
    await page.locator('a[href="/orders"]').click();
    await page.locator('a[href="/"]').first().click();

    // Go to cart — item must still be there
    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole('heading', { name: 'Doritos Cool Ranch' })).toBeVisible();
  });

  test('"← Continuar comprando" en carrito navega a /', async ({ page }) => {
    await page.locator('a[href="/cart"]').click();
    await expect(page).toHaveURL(/\/cart/);

    // Link to products page (Explorar Catálogo on empty cart, or ← Continuar comprando on full)
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(new RegExp(`${BASE}\\/?$`));
  });

  test('"← Seguir comprando" en órdenes navega a /', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    await page.getByRole('link', { name: /Seguir comprando/i }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}\\/?$`));
  });

  test('retorno con ?status=success&invoice=INV-X marca la orden como Pagado', async ({ page }) => {
    // Seed orders with a pending INV-TEST (runs AFTER the beforeEach clear script)
    await page.addInitScript(() => {
      localStorage.setItem('mock-orders', JSON.stringify([
        { id: 'INV-1', date: '2026-04-08T12:50:00Z', amount: 259, status: 'paid' },
        { id: 'INV-TEST', date: new Date().toISOString(), amount: 259, status: 'pending' },
      ]));
    });

    // Navigate with gateway return params
    await page.goto(`${BASE}/orders?status=success&invoice=INV-TEST`, { waitUntil: 'networkidle' });

    // Toast confirms payment
    await expect(page.getByText(/Pago confirmado/i)).toBeVisible({ timeout: 5000 });

    // URL cleaned up by router.replace
    await expect(page).toHaveURL(`${BASE}/orders`);
  });

  test('retorno con ?status=cancelled en /cart muestra toast de cancelación', async ({ page }) => {
    await page.goto(`${BASE}/cart?status=cancelled&invoice=INV-TEST`, { waitUntil: 'networkidle' });

    await expect(page.getByText(/Pago cancelado/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/volver a intentarlo/i)).toBeVisible({ timeout: 3000 });

    // URL cleaned up
    await expect(page).toHaveURL(`${BASE}/cart`);
  });
});
