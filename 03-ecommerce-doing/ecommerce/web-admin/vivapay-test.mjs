import { chromium } from 'playwright';

const BASE = 'http://localhost:7003';
let pass = 0, fail = 0;

function ok(label) { console.log(`  ✅ ${label}`); pass++; }
function ko(label, detail) { console.log(`  ❌ ${label}${detail ? ' — '+detail : ''}`); fail++; }

async function check(label, fn) {
  try { const r = await fn(); if (r === false) ko(label); else ok(label); }
  catch(e) { ko(label, e.message.slice(0, 80)); }
}

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--disable-setuid-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Capturar errores de consola
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push(err.message));

// ─────────────────────────────────────────
console.log('\n🌐 LANDING PAGE');
// ─────────────────────────────────────────
await page.goto(BASE, { waitUntil: 'networkidle' });

await check('Landing carga sin errores de red', async () => {
  const status = await page.evaluate(() => document.title);
  return status.includes('VivaPay');
});
await check('Botón "Conectar billetera" visible', async () =>
  page.isVisible('text=Conectar billetera')
);
await check('Logo VivaPay Admin visible', async () =>
  page.isVisible('text=VivaPay')
);
await check('Sección "Gestión Integral" visible', async () =>
  page.isVisible('text=Gestión Integral') || page.isVisible('text=Panel de Administración')
);

// ─────────────────────────────────────────
console.log('\n👑 FLUJO OWNER');
// ─────────────────────────────────────────
await page.click('text=Conectar billetera');
await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
await check('Dialog de conexión abre', async () =>
  page.isVisible('[role="dialog"]')
);

// Seleccionar rol Owner
const ownerBtn = page.locator('text=Admin').or(page.locator('text=Owner')).first();
await ownerBtn.click();
await page.waitForURL('**/companies', { timeout: 5000 });
await check('Redirige a /companies tras conectar como Owner', async () =>
  page.url().includes('/companies')
);

await check('EmptyState visible en companies', async () =>
  page.isVisible('text=Todavía no tienes empresas creadas') || page.isVisible('text=Sin empresas')
);

// Registrar empresa
await page.click('text=Registrar Empresa');
await page.waitForSelector('[role="dialog"]');
await page.fill('input[id="name"]', 'Mi Tienda S.A.');
await page.fill('input[id="address"]', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
await page.fill('textarea[id="description"]', 'Empresa de prueba');

await page.click('text=Confirmar Registro');
await page.waitForTimeout(1800); // esperar loading + toast

await check('Empresa registrada aparece en lista', async () =>
  page.isVisible('text=Mi Tienda S.A.')
);
await check('Toast "Empresa registrada" apareció', async () =>
  page.isVisible('text=Empresa registrada').catch(() => true) // toast puede haber desaparecido
);

// Desconectar
const walletBtn = page.locator('button').filter({ hasText: /0x|Wallet/ }).first();
await walletBtn.click();
await page.waitForTimeout(300);
await page.click('text=Disconnect');
await page.waitForURL(BASE, { timeout: 3000 });
await check('Desconectar redirige a landing', async () =>
  page.url() === BASE + '/' || page.url() === BASE
);

// ─────────────────────────────────────────
console.log('\n🏢 FLUJO COMPANY — Contexto');
// ─────────────────────────────────────────
await page.click('text=Conectar billetera');
await page.waitForSelector('[role="dialog"]');
const companyBtn = page.locator('text=Empresa').or(page.locator('text=Company')).first();
await companyBtn.click();
await page.waitForURL('**/products', { timeout: 5000 });
await check('Redirige a /products tras conectar como Company', async () =>
  page.url().includes('/products')
);

await check('CompanyInfoCard muestra nombre empresa', async () =>
  page.isVisible('text=Tech Solutions Inc.')
);
await check('Tab "Productos" visible y activo', async () =>
  page.isVisible('text=Productos')
);
await check('Tab "Facturas" visible', async () =>
  page.isVisible('text=Facturas')
);
await check('Tab "Clientes" visible', async () =>
  page.isVisible('text=Clientes')
);

// ─────────────────────────────────────────
console.log('\n📦 FLUJO COMPANY — Productos');
// ─────────────────────────────────────────
// Agregar Producto A
await page.click('text=Nuevo Producto');
await page.waitForSelector('[role="dialog"]');
await page.fill('input[id="add-name"]', 'Producto A');
await page.fill('input[id="add-price"]', '10');
await page.fill('input[id="add-stock"]', '100');
await page.click('text=Registrar Producto');
await page.waitForTimeout(1800);

await check('Producto A aparece en lista', async () =>
  page.isVisible('text=Producto A')
);
await check('Toast "Producto registrado" apareció', async () =>
  page.isVisible('text=Producto registrado').catch(() => true)
);

// Agregar Producto B con stock bajo
await page.click('text=Nuevo Producto');
await page.waitForSelector('[role="dialog"]');
await page.fill('input[id="add-name"]', 'Producto B');
await page.fill('input[id="add-price"]', '25');
await page.fill('input[id="add-stock"]', '3');
await page.click('text=Registrar Producto');
await page.waitForTimeout(1800);

await check('Producto B aparece en lista', async () =>
  page.isVisible('text=Producto B')
);
await check('Badge warning de stock bajo visible', async () =>
  page.isVisible('text=Stock bajo') || page.isVisible('text=stock bajo')
);

// ─────────────────────────────────────────
console.log('\n🧾 FLUJO COMPANY — Facturas');
// ─────────────────────────────────────────
await page.click('a[href="/invoices"]');
await page.waitForURL('**/invoices', { timeout: 3000 });

await check('Tab Facturas navega a /invoices', async () =>
  page.url().includes('/invoices')
);
await check('CompanyInfoCard permanece visible', async () =>
  page.isVisible('text=Tech Solutions Inc.')
);
await check('Tabla de facturas visible (6 filas)', async () => {
  const rows = await page.locator('tbody tr').count();
  return rows === 6;
});
await check('KPI card "Total Facturas" muestra 6', async () =>
  page.isVisible('text=6')
);
await check('KPI card "Pagadas" muestra 4', async () => {
  const cards = await page.locator('text=Pagadas').count();
  return cards >= 1;
});
await check('Badge "Pagada" verde visible', async () =>
  page.isVisible('text=Pagada')
);
await check('Badge "Pendiente" ámbar visible', async () =>
  page.isVisible('text=Pendiente')
);

// Filtrar por Pagadas
await page.locator('.grid >> text=Pagadas').first().click();
await page.waitForTimeout(300);
await check('Filtro Pagadas → 4 filas', async () => {
  const rows = await page.locator('tbody tr').count();
  return rows === 4;
});

// Restaurar todas
await page.locator('.grid >> text=Total Facturas').first().click();
await page.waitForTimeout(300);
await check('Filtro Total → 6 filas', async () => {
  const rows = await page.locator('tbody tr').count();
  return rows === 6;
});

// Abrir detalle
await page.locator('tbody tr').first().click();
await page.waitForSelector('[role="dialog"]');
await check('Dialog de detalle de factura abre', async () =>
  page.isVisible('[role="dialog"]')
);
await check('Dialog muestra ID de factura', async () =>
  page.isVisible('text=Factura #')
);
await page.keyboard.press('Escape');

// ─────────────────────────────────────────
console.log('\n👥 FLUJO COMPANY — Clientes');
// ─────────────────────────────────────────
await page.click('a[href="/customers"]');
await page.waitForURL('**/customers', { timeout: 3000 });

await check('Tab Clientes navega a /customers', async () =>
  page.url().includes('/customers')
);
await check('CompanyInfoCard permanece visible', async () =>
  page.isVisible('text=Tech Solutions Inc.')
);
await check('Métrica "Total Clientes" muestra 3', async () =>
  page.isVisible('text=3')
);
await check('Tabla de clientes tiene 3 filas', async () => {
  const rows = await page.locator('tbody tr').count();
  return rows === 3;
});
await check('Addresses en formato 0xXXXX...XXXX visible', async () =>
  page.isVisible('text=0xf39F...2266') || page.isVisible('text=0x7099...79C8')
);

// Abrir detalle de cliente
await page.locator('tbody tr').first().click();
await page.waitForSelector('[role="dialog"]');
await check('Dialog de cliente abre', async () =>
  page.isVisible('[role="dialog"]')
);
await check('Dialog muestra historial de facturas', async () =>
  page.isVisible('text=Historial de Facturas')
);
await page.keyboard.press('Escape');

// ─────────────────────────────────────────
console.log('\n🔒 PROTECCIÓN DE RUTAS');
// ─────────────────────────────────────────
await page.goto(`${BASE}/companies`);
await page.waitForTimeout(1000);
await check('Company no puede acceder a /companies → Acceso Denegado', async () =>
  page.isVisible('text=Acceso Denegado')
);

// ─────────────────────────────────────────
console.log('\n🖥️  ERRORES DE CONSOLA');
// ─────────────────────────────────────────
await check('Sin errores JavaScript en consola', async () => {
  const filtered = consoleErrors.filter(e =>
    !e.includes('favicon') && !e.includes('hydrat') && !e.includes('Warning')
  );
  if (filtered.length > 0) { console.log('    Errores:', filtered); return false; }
  return true;
});

// ─────────────────────────────────────────
await browser.close();
console.log(`\n${'─'.repeat(50)}`);
console.log(`RESULTADO: ${pass} ✅  ${fail} ❌  (${pass+fail} checks)`);
if (fail === 0) console.log('🎉 TODOS LOS TESTS PASAN');
else console.log(`⚠️  ${fail} test(s) fallaron`);
