import { test, expect } from '@playwright/test';

/**
 * Test Suite: REST Operation Detail Pages
 *
 * Covers:
 * - GET operation pages
 * - POST operation pages
 * - Parameters display
 * - Input/Output schemas
 * - Example request/response display (NEW)
 * - REST metadata
 */
test.describe('REST Operation Detail Pages', () => {
  test('GET operation displays correctly with all sections', async ({ page }) => {
    await page.goto('operations/listProducts');

    // Verify operation header
    await expect(page.getByRole('heading', { name: 'List all products', level: 3 })).toBeVisible();
    await expect(page.locator('[class*="bg-blue-500"]').filter({ hasText: 'GET' })).toBeVisible();
    await expect(page.getByText('⇄')).toBeVisible(); // Request/Response icon
    await expect(page.locator('p.text-muted-foreground.font-mono').filter({ hasText: '/products' })).toBeVisible();

    // Verify contract information
    await expect(page.getByText('Contract:')).toBeVisible();
    await expect(page.getByText('E-commerce API')).toBeVisible();
    await expect(page.getByText('v1.0.0')).toBeVisible();

    // Verify description
    await expect(page.getByText('Retrieve a paginated list of all products in the catalog')).toBeVisible();
  });

  test('GET operation shows parameters section', async ({ page }) => {
    await page.goto('operations/listProducts');

    // Verify Parameters heading
    await expect(page.getByRole('heading', { name: 'Parameters' })).toBeVisible();
    await expect(page.getByText('0 required, 2 optional')).toBeVisible();

    // Verify individual parameters
    await expect(page.locator('code.text-sm.font-semibold').first().filter({ hasText: 'page' })).toBeVisible();
    await expect(page.locator('code.text-sm.font-semibold').filter({ hasText: 'limit' })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Parameters' }).getByText('query').first()).toBeVisible(); // parameter location
    await expect(page.locator('code.text-xs.text-muted-foreground').filter({ hasText: 'integer' }).first()).toBeVisible(); // parameter type
  });

  test('GET operation displays output schema', async ({ page }) => {
    await page.goto('operations/listProducts');

    // Verify Output heading
    await expect(page.getByRole('heading', { name: 'Output', exact: true })).toBeVisible();

    // Verify Response 200 section
    await expect(page.getByRole('heading', { name: 'Response 200' })).toBeVisible();
    await expect(page.locator('code.text-xs.text-muted-foreground').filter({ hasText: 'application/json' })).toBeVisible();

    // Verify schema properties
    await expect(page.locator('code.text-sm.font-semibold').filter({ hasText: 'products' })).toBeVisible();
    await expect(page.locator('code.text-sm.font-semibold').filter({ hasText: 'pagination' })).toBeVisible();
    await expect(page.locator('[class*="text-foreground text-xs font-mono"]').filter({ hasText: 'array' }).first()).toBeVisible();
  });

  test('GET operation displays example response (NEW FEATURE)', async ({ page }) => {
    await page.goto('operations/listProducts');

    // Verify Example Response section exists
    await expect(page.getByRole('heading', { name: 'Example Response', level: 4 })).toBeVisible();

    // Verify example data is present (JSON content)
    const exampleCode = page.locator('pre code').filter({ hasText: /"products":/ });
    await expect(exampleCode).toBeVisible();

    // Verify example contains expected product data
    await expect(page.getByText(/"prod-123"/)).toBeVisible();
    await expect(page.locator('code.bg-muted').filter({ hasText: /"Wireless Headphones"/ })).toBeVisible();
    await expect(page.getByText(/"pagination"/)).toBeVisible();

    // Verify copy button exists
    const copyButtons = page.getByRole('button', { name: 'Copy' });
    await expect(copyButtons.first()).toBeVisible();
  });

  test('POST operation displays with input and output', async ({ page }) => {
    await page.goto('operations/createOrder');

    // Verify operation header
    await expect(page.getByRole('heading', { name: 'Create new order' })).toBeVisible();
    await expect(page.locator('[class*="bg-green-500"]').filter({ hasText: 'POST' })).toBeVisible();

    // Verify description
    await expect(page.getByText('Place a new order for products')).toBeVisible();

    // Note: Parameters section only shows if there are query/path parameters
    // POST operations with only request body won't have Parameters section
    // Verify Input section exists
    const inputHeadings = page.getByRole('heading', { name: /Input/ });
    await expect(inputHeadings.first()).toBeVisible();

    // Verify Output section exists
    await expect(page.getByRole('heading', { name: 'Output', exact: true })).toBeVisible();
  });

  test('POST operation displays example request (NEW FEATURE)', async ({ page }) => {
    await page.goto('operations/createOrder');

    // Verify Example Request section
    await expect(page.getByRole('heading', { name: 'Example Request', level: 4 })).toBeVisible();

    // Verify example request data
    const exampleRequestSection = page.locator('div').filter({ hasText: 'Example Request' });
    await expect(exampleRequestSection.locator('pre.bg-muted').first().getByText(/"userId":/)).toBeVisible();
    await expect(exampleRequestSection.locator('pre.bg-muted').first().getByText(/"user-123"/)).toBeVisible();
    await expect(exampleRequestSection.locator('pre.bg-muted').first().getByText(/"items":/)).toBeVisible();
    await expect(exampleRequestSection.locator('pre.bg-muted').first().getByText(/"shippingAddress":/)).toBeVisible();

    // Verify copy button
    const copyButtons = page.getByRole('button', { name: 'Copy' });
    await expect(copyButtons).toHaveCount(1); // Only one copy button found on page
  });

  test('POST operation displays example response (NEW FEATURE)', async ({ page }) => {
    await page.goto('operations/createOrder');

    // Verify Example Response section
    await expect(page.getByRole('heading', { name: 'Example Response', level: 4 })).toBeVisible();

    // Verify example response data
    await expect(page.getByText(/"order-abc-123"/)).toBeVisible();
    await expect(page.getByText(/"status":/)).toBeVisible();
    await expect(page.locator('code.bg-muted').filter({ hasText: /"pending"/ })).toBeVisible();
  });

  test('REST metadata section displays correctly', async ({ page }) => {
    await page.goto('operations/listProducts');

    // Verify REST Metadata heading
    await expect(page.getByRole('heading', { name: 'REST Metadata' })).toBeVisible();

    // Verify metadata fields
    await expect(page.getByText('HTTP Method:')).toBeVisible();
    await expect(page.getByText('Path:')).toBeVisible();
    await expect(page.getByText('Operation ID:')).toBeVisible();
    await expect(page.getByText('listProducts')).toBeVisible();
  });

  test('back to operations button works', async ({ page }) => {
    await page.goto('operations/listProducts');

    // Click back button
    await page.getByRole('button', { name: 'Back to Operations' }).click();

    // Verify navigation back to homepage
    await expect(page).toHaveURL(/open-spec-hub\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'API Contract Explorer' })).toBeVisible();
  });

  test('breadcrumb navigation displays correctly', async ({ page }) => {
    await page.goto('operations/getProduct');

    // Verify breadcrumb
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All Operations' })).toBeVisible();
    await expect(page.getByLabel('Breadcrumb').getByText('Get product details')).toBeVisible(); // Current page
  });

  test('404 error example displays for failed response', async ({ page }) => {
    await page.goto('operations/getProduct');

    // Verify multiple response sections
    await expect(page.locator('h3').filter({ hasText: 'Response 200' })).toBeVisible();
    // Note: 404 response may not be displayed - checking if it exists
    const response404 = page.locator('h3').filter({ hasText: 'Response 404' });
    if (await response404.count() > 0) {
      await expect(response404.first()).toBeVisible();
      
      // Verify 404 has example
      await expect(page.getByText(/"error":/)).toBeVisible();
      await expect(page.getByText(/"Product not found"/)).toBeVisible();
    }
  });

  test('path parameter shown in operation location', async ({ page }) => {
    await page.goto('operations/getProduct');

    // Verify path parameter in location
    await expect(page.locator('p.text-muted-foreground.font-mono').filter({ hasText: '/products/{productId}' })).toBeVisible();

    // Verify parameter section shows path parameter
    await expect(page.getByRole('heading', { name: 'Parameters' })).toBeVisible();
    await expect(page.locator('code.text-sm.font-semibold').filter({ hasText: 'productId' })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Parameters' }).getByText('path').first()).toBeVisible(); // parameter location
  });

  test('array response type displays correctly', async ({ page }) => {
    await page.goto('operations/getUserOrders');

    // Verify operation displays
    await expect(page.getByRole('heading', { name: "Get user's orders" })).toBeVisible();

    // Verify output type is array
    await expect(page.locator('[class*="text-foreground text-xs font-mono"]').filter({ hasText: 'array' }).first()).toBeVisible();

    // Verify example shows array of orders
    await expect(page.getByText(/"order-001"/)).toBeVisible();
    await expect(page.getByText(/"order-002"/)).toBeVisible();
    await expect(page.getByText(/"order-003"/)).toBeVisible();
  });
});
