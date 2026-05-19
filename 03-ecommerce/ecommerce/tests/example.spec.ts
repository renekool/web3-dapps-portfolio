import { test, expect } from '@playwright/test';

test('can reach web-customer', async ({ page }) => {
  const response = await page.goto('http://127.0.0.1:7004');
  console.log('web-customer status:', response?.status());
  expect(response?.status()).toBe(200);
});

test('can reach web-payment-gateway', async ({ page }) => {
  const response = await page.goto('http://127.0.0.1:7002');
  console.log('web-payment-gateway status:', response?.status());
  expect(response?.status()).toBe(200);
});
