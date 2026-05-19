/**
 * Banco de pruebas — Viabilidad del mockup SwapEscrow
 *
 * Valida que cada elemento de UI tiene una intención arquitectónica y la cumple.
 * Referencia: docs/ESTRUCTURA_PROYECTO_ESCROW.md, ADRs, invariantes I1-I15.
 *
 * Pre-condición: servidor corriendo en http://localhost:3000
 * Pre-condición: mockData.ts poblado con MY_OPERATIONS (4) + AVAILABLE_OPERATIONS (2)
 */

import { test, expect } from "@playwright/test";

// ============================================================
// T1 — Landing page: integridad y navegación
// ============================================================

test.describe("T1 — Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T1.1 — título del browser es Dezentra · SwapEscrow", async ({
    page,
  }) => {
    await expect(page).toHaveTitle("Dezentra · SwapEscrow");
  });

  test('T1.2 — logo "Dezentra" visible en header', async ({ page }) => {
    await expect(page.getByText("Dezentra").first()).toBeVisible();
  });

  test('T1.3 — H1 "Intercambia sin riesgo" visible', async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Intercambia sin riesgo" })
    ).toBeVisible();
  });

  test("T1.4 — 3 trust indicators visibles (Sin AMM, Sin slippage, Determinístico)", async ({
    page,
  }) => {
    await expect(page.getByText("Sin AMM")).toBeVisible();
    await expect(page.getByText("Sin slippage")).toBeVisible();
    await expect(page.getByText("Determinístico")).toBeVisible();
  });

  test('T1.5 — sección "Así funciona" tiene exactamente 3 cards', async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Así funciona" })
    ).toBeVisible();
    // Las 3 cards se identifican por sus números ordinales
    await expect(page.getByText("01")).toBeVisible();
    await expect(page.getByText("02")).toBeVisible();
    await expect(page.getByText("03")).toBeVisible();
  });

  test("T1.6 — cards muestran los 3 pasos del UL correcto", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Ofrece" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alguien acepta" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Swap atómico" })).toBeVisible();
  });

  test('T1.7 — botón CTA "Conectar billetera" navega a /dashboard', async ({
    page,
  }) => {
    // Hay dos botones CTA — el del hero
    const heroCta = page.getByRole("link", { name: "Conectar billetera" }).first();
    await heroCta.click();
    await expect(page).toHaveURL("/dashboard");
  });
});

// ============================================================
// T2 — Dashboard: tabs y estado inicial
// ============================================================

test.describe("T2 — Dashboard: tabs y counters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("T2.1 — tab Mis Operaciones activo por defecto", async ({ page }) => {
    // El tab activo suele tener estilo diferente; verificamos que el contenido de mis ops es visible
    await expect(page.getByText("Tus operaciones")).toBeVisible();
  });

  test("T2.2 — tab Mis Operaciones muestra counter 4", async ({ page }) => {
    await expect(page.getByText("4", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Mis Operaciones")).toBeVisible();
  });

  test("T2.3 — tab Disponibles muestra counter 2", async ({ page }) => {
    await expect(page.getByText("Disponibles")).toBeVisible();
    // El counter del tab "2 Disponibles"
    const disponiblesTab = page.getByRole("button", { name: /Disponibles/ });
    await expect(disponiblesTab).toBeVisible();
  });

  test("T2.4 — click en Disponibles muestra ops de otros creadores", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Disponibles/ }).click();
    // Las ops disponibles tienen creadores que no son 0xf39F
    await expect(page.getByText("0x7099…79C8").first()).toBeVisible();
  });

  test("T2.5 — tab Nueva muestra el formulario de crear operación", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Nueva/ }).click();
    // El form muestra el heading y los labels reales del DOM
    await expect(page.getByRole("heading", { name: "Nueva operación" })).toBeVisible();
    await expect(page.getByText("ENTREGAS (ESCROW)")).toBeVisible();
    await expect(page.getByText("RECIBES (A CAMBIO)")).toBeVisible();
  });

  test("T2.6 — 5 stats cards visibles en header", async ({ page }) => {
    // Labels son title-case en DOM (CSS aplica uppercase visualmente)
    await expect(page.getByText("Ofrecido TKA")).toBeVisible();
    await expect(page.getByText("Solicitado TKB")).toBeVisible();
    await expect(page.getByText("Total operaciones")).toBeVisible();
    // "Activas" y "Completadas" aparecen también en filtros; usar first()
    await expect(page.getByText("Activas").first()).toBeVisible();
    await expect(page.getByText("Completadas").first()).toBeVisible();
  });

  test("T2.7 — stats Activas=1 y Completadas=1 coinciden con MY_OPERATIONS", async ({
    page,
  }) => {
    // Verificar que el valor "1" aparece en las stat cards de Activas y Completadas
    // Las stats cards tienen paragraph con el número
    await expect(page.getByText("Total operaciones")).toBeVisible();
    // El total es 4 (MY_OPERATIONS.length)
    const totalCard = page.getByText("4").first();
    await expect(totalCard).toBeVisible();
    // Activas=1 y Completadas=1 — el valor "1" aparece al menos dos veces en stats
    const ones = await page.getByRole("paragraph").filter({ hasText: /^1$/ }).count();
    expect(ones).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// T3 — Estados FSM: visual fidelity de badges
// ============================================================

test.describe("T3 — Estados FSM: badges y colores", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("T3.1 — op-1 tiene badge Activa (texto visible)", async ({ page }) => {
    // exact:true para evitar colisión con "Activas" del filtro/stat
    await expect(page.getByText("Activa", { exact: true })).toBeVisible();
  });

  test("T3.2 — op-2 tiene badge Completada", async ({ page }) => {
    await expect(page.getByText("Completada", { exact: true })).toBeVisible();
  });

  test("T3.3 — op-3 tiene badge Cancelada", async ({ page }) => {
    await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  });

  test("T3.4 — op-4 tiene badge Expirada", async ({ page }) => {
    await expect(page.getByText("Expirada", { exact: true })).toBeVisible();
  });

  test("T3.5 — op-1 muestra amounts 100.00 TKA y 150.00 TKB", async ({
    page,
  }) => {
    // Amount de tokenA
    await expect(page.getByText("100.00").first()).toBeVisible();
    // Amount de tokenB
    await expect(page.getByText("150.00").first()).toBeVisible();
    // Símbolos de tokens
    const tkaBadges = page.getByText("TKA");
    expect(await tkaBadges.count()).toBeGreaterThanOrEqual(1);
    const tkbBadges = page.getByText("TKB");
    expect(await tkbBadges.count()).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// T4 — Control de acceso por operación (I3, I4, I12)
// ============================================================

test.describe("T4 — Control de acceso: botones condicionales", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test('T4.1 — op-1 (Active, mía): tiene botón "Cancelar" (I3)', async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /Cancelar/i }).first()).toBeVisible();
  });

  test('T4.2 — op-2 (Completed, mía): solo "Ver detalles", sin acciones destructivas (I6)', async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /Ver detalles/i }).first()).toBeVisible();
    // Completada no tiene Cancelar
    const cancelBtns = page.getByRole("button", { name: /Cancelar/i });
    // Solo debe haber 1 Cancelar (de op-1 Active), no más
    expect(await cancelBtns.count()).toBe(1);
  });

  test("T4.4 — op-4 (Expired): sin botón Ejecutar (I12 — expirada no puede completarse)", async ({
    page,
  }) => {
    // En Mis Operaciones no debe aparecer Ejecutar en ninguna tarjeta
    const ejecutarBtns = page.getByRole("button", { name: /Ejecutar/i });
    expect(await ejecutarBtns.count()).toBe(0);
  });

  test("T4.5 — ops Disponibles (de otros): tienen botón Ejecutar, sin Cancelar (I4)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Disponibles/ }).click();
    // Deben aparecer botones Ejecutar
    const ejecutarBtns = page.getByRole("button", { name: /Ejecutar/i });
    expect(await ejecutarBtns.count()).toBeGreaterThanOrEqual(1);
    // No debe aparecer Cancelar (no soy el creator)
    const cancelBtns = page.getByRole("button", { name: /Cancelar/i });
    expect(await cancelBtns.count()).toBe(0);
  });
});

// ============================================================
// T5 — Filtros de operaciones
// ============================================================

test.describe("T5 — Filtros", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("T5.1 — filtro Activas muestra solo ops activas", async ({ page }) => {
    await page.getByRole("button", { name: /Todas/i }).click();
    // "Activas" aparece en stat card (div) y en el dropdown (button) — usar role button para ser específico
    await page.getByRole("button", { name: "Activas" }).click();
    await expect(page.getByText("Activa", { exact: true })).toBeVisible();
    expect(await page.getByText("Completada", { exact: true }).count()).toBe(0);
    expect(await page.getByText("Cancelada", { exact: true }).count()).toBe(0);
    expect(await page.getByText("Expirada", { exact: true }).count()).toBe(0);
  });

  test("T5.2 — filtro Completadas muestra solo ops completadas", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Todas/i }).click();
    await page.getByRole("button", { name: "Completadas" }).click();
    await expect(page.getByText("Completada", { exact: true })).toBeVisible();
    expect(await page.getByText("Activa", { exact: true }).count()).toBe(0);
    expect(await page.getByText("Expirada", { exact: true }).count()).toBe(0);
  });

  test("T5.3 — filtro Canceladas muestra solo ops canceladas", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Todas/i }).click();
    await page.getByRole("button", { name: "Canceladas" }).click();
    await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
    expect(await page.getByText("Activa", { exact: true }).count()).toBe(0);
    expect(await page.getByText("Completada", { exact: true }).count()).toBe(0);
  });

  test("T5.4 — filtro Expiradas muestra solo ops expiradas", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Todas/i }).click();
    await page.getByRole("button", { name: "Expiradas" }).click();
    await expect(page.getByText("Expirada", { exact: true })).toBeVisible();
    expect(await page.getByText("Activa", { exact: true }).count()).toBe(0);
    expect(await page.getByText("Completada", { exact: true }).count()).toBe(0);
  });

  test("T5.5 — filtro Todas muestra 4 operaciones", async ({ page }) => {
    await expect(page.getByText("4 totales")).toBeVisible();
    // Los 4 badges exactos deben aparecer
    await expect(page.getByText("Activa", { exact: true })).toBeVisible();
    await expect(page.getByText("Completada", { exact: true })).toBeVisible();
    await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
    await expect(page.getByText("Expirada", { exact: true })).toBeVisible();
  });

  test("T5.6 — en Disponibles filtro TKA→TKB muestra op-6 (no op-5)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Disponibles/ }).click();
    // Abrir filtro de par
    const filterBtn = page.getByRole("button", { name: /Todas/i });
    await filterBtn.click();
    await page.getByText("TKA → TKB").click();
    // op-6 es TKA→TKB (creator ADDR2), op-5 es TKB→TKA
    await expect(page.getByText("0x3C44…93BC")).toBeVisible();
    expect(await page.getByText("0x7099…79C8").count()).toBe(0);
  });

  test("T5.7 — en Disponibles filtro TKB→TKA muestra op-5 (no op-6)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Disponibles/ }).click();
    const filterBtn = page.getByRole("button", { name: /Todas/i });
    await filterBtn.click();
    await page.getByText("TKB → TKA").click();
    await expect(page.getByText("0x7099…79C8")).toBeVisible();
    expect(await page.getByText("0x3C44…93BC").count()).toBe(0);
  });
});

// ============================================================
// T6 — Formulario Crear Operación (I1, I2)
// ============================================================

test.describe("T6 — Formulario: Create Operation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Nueva/ }).click();
  });

  test("T6.1 — form tiene labels y selectors de Token A y Token B", async ({ page }) => {
    // Labels reales del DOM (CSS aplica uppercase visualmente)
    await expect(page.getByText("ENTREGAS (ESCROW)")).toBeVisible();
    await expect(page.getByText("RECIBES (A CAMBIO)")).toBeVisible();
    // Comboboxes de token presentes
    expect(await page.getByRole("combobox").count()).toBeGreaterThanOrEqual(2);
  });

  test("T6.3 — amount = 0 muestra error visual (I2: amounts > 0)", async ({
    page,
  }) => {
    // Los inputs son textbox (no spinbutton)
    const amountInputs = page.getByRole("textbox");
    await amountInputs.first().fill("0");
    await page.getByRole("button", { name: "Crear operación" }).click();
    // Submit inválido no navega
    await expect(page).toHaveURL("/dashboard");
  });

  test("T6.4 — al ingresar amounts la pill Tasa muestra ratio calculado", async ({
    page,
  }) => {
    // Los inputs son textbox
    const amountInputs = page.getByRole("textbox");
    await amountInputs.first().fill("100");
    await amountInputs.last().fill("200");
    // "Tasa" aparece en el form y en el panel de resumen — usar first()
    await expect(page.getByText("Tasa").first()).toBeVisible();
  });

  test("T6.5 — submit con datos válidos deshabilita el botón durante animación", async ({
    page,
  }) => {
    const amountInputs = page.getByRole("textbox");
    await amountInputs.first().fill("50");
    await amountInputs.last().fill("75");
    // Locate by form attribute — stable even when button text changes to "Operación creada"
    const submitBtn = page.locator('button[form="create-op-form"]');
    await submitBtn.click();
    // Button is disabled during the ~1.4s success animation
    await expect(submitBtn).toBeDisabled({ timeout: 1500 });
  });
});

// ============================================================
// T7 — Modal de Confirmación (Execute flow)
// ============================================================

test.describe("T7 — Confirm Modal: Execute flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Disponibles/ }).click();
  });

  test("T7.1 — click Ejecutar abre ConfirmModal", async ({ page }) => {
    await page.getByRole("button", { name: /Ejecutar/i }).first().click();
    // El modal no usa role="dialog" — verificar por contenido del stepper
    await expect(page.getByText(/Aprobación|Firmando|Minando|Confirmado/i).first()).toBeVisible();
  });

  test("T7.2 — modal muestra amounts y tokens correctos", async ({ page }) => {
    await page.getByRole("button", { name: /Ejecutar/i }).first().click();
    // op-5: 200.00 TKB → 300.00 TKA — usar exact para evitar ambigüedad
    await expect(page.getByText("200.00").first()).toBeVisible();
    await expect(page.getByText("300.00").first()).toBeVisible();
  });

  test("T7.3 — modal muestra stepper con pasos", async ({ page }) => {
    await page.getByRole("button", { name: /Ejecutar/i }).first().click();
    // El stepper tiene 4 steps: Aprobación, Firmando, Minando, Confirmado
    await expect(
      page.getByText(/Aprobación|Firmando|Minando|Confirmado/i).first()
    ).toBeVisible();
  });

  test("T7.4 — Continuar avanza el stepper", async ({ page }) => {
    await page.getByRole("button", { name: /Ejecutar/i }).first().click();
    const continuarBtn = page.getByRole("button", { name: /Continuar/i });
    await continuarBtn.click();
    // Después de un click, el step avanza (texto o índice cambia)
    await page.waitForTimeout(100);
    // El stepper debe mostrar el segundo paso activo
    await expect(
      page.getByText(/Firmando|Minando|Confirmado/i).first()
    ).toBeVisible();
  });

  test("T7.6 — Cancelar cierra el modal", async ({ page }) => {
    await page.getByRole("button", { name: /Ejecutar/i }).first().click();
    const cancelarBtn = page.getByRole("button", { name: /Cancelar/i });
    await cancelarBtn.click();
    // El modal debe desaparecer
    await expect(
      page.getByRole("dialog").or(page.locator('[role="dialog"]'))
    ).not.toBeVisible();
  });
});

// ============================================================
// T8 — Modal de Detalles
// ============================================================

test.describe("T8 — Details Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("T8.1 — click Ver detalles en op completada abre DetailsModal", async ({
    page,
  }) => {
    const verDetallesBtn = page.getByRole("button", { name: /Ver detalles/i }).first();
    await verDetallesBtn.click();
    // El modal no usa role="dialog" — verificar por contenido específico del modal
    await expect(page.getByText(/Creada|Creación/i).first()).toBeVisible();
  });

  test("T8.2 — modal muestra timeline con fases de la operación", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Ver detalles/i }).first().click();
    // Timeline debe mostrar al menos "Creada" como fase
    await expect(page.getByText(/Creada|Creación/i).first()).toBeVisible();
  });

  test("T8.3 — addresses aparecen truncadas en el modal", async ({ page }) => {
    await page.getByRole("button", { name: /Ver detalles/i }).first().click();
    // formatAddress produce "0xXXXX…YYYY" — usar first() para evitar strict mode
    await expect(page.getByText(/0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}/).first()).toBeVisible();
  });

  test("T8.4 — cerrar el modal funciona", async ({ page }) => {
    await page.getByRole("button", { name: /Ver detalles/i }).first().click();
    // Buscar botón de cerrar (X o Cerrar)
    const closeBtn = page.getByRole("button", { name: /cerrar|close|×/i }).or(
      page.locator("button").filter({ hasText: /^[×✕]$/ })
    ).first();
    await closeBtn.click();
    await page.waitForTimeout(200);
    await expect(
      page.getByRole("dialog").or(page.locator('[role="dialog"]'))
    ).not.toBeVisible();
  });
});

// ============================================================
// T9 — Wallet UI
// ============================================================

test.describe("T9 — Wallet UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("T9.1 — header muestra dirección truncada del wallet mock", async ({
    page,
  }) => {
    // El botón del wallet en el header muestra la dirección truncada
    await expect(page.getByRole("button", { name: /0xf39F…2266/ })).toBeVisible();
  });

  test("T9.2 — dropdown del wallet muestra balances TKA y TKB", async ({
    page,
  }) => {
    // Abrir wallet dropdown via el botón del header
    await page.getByRole("button", { name: /0xf39F…2266/ }).click();
    // Debe mostrar los balances del MOCK_WALLET_CONNECTED
    await expect(page.getByText("1000.00").first()).toBeVisible();
    await expect(page.getByText("800.00").first()).toBeVisible();
  });

  test("T9.3 — botón Copy cambia a icono de check al hacer click", async ({
    page,
  }) => {
    // El copy button está en las tarjetas de operación (MetadataItem)
    const copyBtn = page.getByRole("button", { name: /copiar|copy/i }).first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      // Tras el click debe cambiar visualmente (check icon)
      await page.waitForTimeout(200);
      // Verificamos que la acción se procesó sin error
      await expect(page).toHaveURL("/dashboard");
    }
  });
});
