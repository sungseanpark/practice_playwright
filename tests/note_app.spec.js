const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('https://www.apartments.com/hallasan-los-angeles-ca/n7jh9pm/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Hallasan/);
});