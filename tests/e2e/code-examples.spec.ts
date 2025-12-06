import { test, expect } from '@playwright/test';

/**
 * Test Suite: Code Examples
 *
 * Covers:
 * - Code examples section display
 * - Language tab switching
 * - REST code generation (JavaScript, Python, cURL)
 * - AsyncAPI code generation (JavaScript, Python)
 * - Generated code validity
 * - Copy-to-clipboard functionality
 */
test.describe('Code Examples', () => {
  test.describe('REST Operations', () => {
    test('displays code examples section', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Verify Code Examples heading
      await expect(page.getByText('💻 Code Examples')).toBeVisible();

      // Verify copy button
      await expect(page.locator('button').filter({ has: page.locator('svg') }).last()).toBeVisible();
    });

    test('shows 3 language tabs for REST (JavaScript, Python, cURL)', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Verify all three language tabs
      await expect(page.getByText('JavaScript', { exact: true })).toBeVisible();
      await expect(page.getByText('Python', { exact: true })).toBeVisible();
      await expect(page.getByText('cURL', { exact: true })).toBeVisible();
    });

    test('JavaScript code contains valid fetch call', async ({ page }) => {
      await page.goto('operations/listProducts');

      // JavaScript should be selected by default
      const codeBlock = page.locator('pre code').last();

      // Verify JavaScript patterns
      await expect(codeBlock).toContainText('async function');
      await expect(codeBlock).toContainText('list_products');
      await expect(codeBlock).toContainText('await fetch');
      await expect(codeBlock).toContainText('https://api.example.com/v1/products');
      await expect(codeBlock).toContainText("method: 'GET'");
      await expect(codeBlock).toContainText('response.json()');
    });

    test('Python tab shows valid requests code', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Click Python tab
      await page.getByText('Python', { exact: true }).click();

      const codeBlock = page.locator('pre code').last();

      // Verify Python patterns
      await expect(codeBlock).toContainText('import requests');
      await expect(codeBlock).toContainText('def list_products');
      await expect(codeBlock).toContainText('requests.get');
      await expect(codeBlock).toContainText('response.raise_for_status()');
      await expect(codeBlock).toContainText('response.json()');
    });

    test('cURL tab shows valid curl command', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Click cURL tab
      await page.getByText('cURL', { exact: true }).click();

      const codeBlock = page.locator('pre code').last();

      // Verify cURL patterns
      await expect(codeBlock).toContainText('curl');
      await expect(codeBlock).toContainText('-X GET');
      await expect(codeBlock).toContainText('https://api.example.com/v1/products');
      await expect(codeBlock).toContainText('-H');
    });

    test('POST operation includes request body in code', async ({ page }) => {
      await page.goto('operations/createOrder');

      const codeBlock = page.locator('pre code').last();

      // Verify POST-specific patterns in JavaScript
      await expect(codeBlock).toContainText("method: 'POST'");
      await expect(codeBlock).toContainText('body: JSON.stringify');
      await expect(codeBlock).toContainText('userId');
      await expect(codeBlock).toContainText('items');
      await expect(codeBlock).toContainText('shippingAddress');
    });

    test('path parameters are replaced with example values', async ({ page }) => {
      await page.goto('operations/getProduct');

      const codeBlock = page.locator('pre code').last();

      // Verify path parameter replacement (should use example productId)
      await expect(codeBlock).toContainText('/products/');
      // Should not have literal {productId}
      await expect(codeBlock).not.toContainText('{productId}');
    });

    test('helper text displays for REST operations', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Verify helper text
      await expect(page.getByText(/This example shows how to call the/i)).toBeVisible();
      await expect(page.locator('strong').filter({ hasText: 'GET' })).toBeVisible();
      await expect(page.getByText(/operation\./)).toBeVisible();
    });
  });

  test.describe('AsyncAPI Operations', () => {
test('displays code examples section for AsyncAPI', async ({ page }) => {
      await page.goto('operations/onUserSignedUp');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Verify Code Examples heading
      await expect(page.getByText('💻 Code Examples')).toBeVisible();
    });

    test('shows 2 language tabs for AsyncAPI (JavaScript, Python)', async ({ page }) => {
      await page.goto('operations/subscribeOrderCreated');

      // Verify language tabs (no cURL for AsyncAPI)
      await expect(page.getByText('JavaScript', { exact: true })).toBeVisible();
      await expect(page.getByText('Python', { exact: true })).toBeVisible();

      // Should NOT show cURL
      await expect(page.getByText('cURL', { exact: true })).not.toBeVisible();
    });

    test('JavaScript shows KafkaJS consumer code for SUBSCRIBE', async ({ page }) => {
      await page.goto('operations/subscribeOrderCreated');

      const codeBlock = page.locator('pre code').last();

      // Verify KafkaJS patterns
      await expect(codeBlock).toContainText('const { Kafka }');
      await expect(codeBlock).toContainText('require(\'kafkajs\')');
      await expect(codeBlock).toContainText('consumer');
      await expect(codeBlock).toContainText('await consumer.subscribe');
      await expect(codeBlock).toContainText('orders.created');
      await expect(codeBlock).toContainText('await consumer.run');
    });

    test('JavaScript shows KafkaJS producer code for PUBLISH', async ({ page }) => {
      await page.goto('operations/publishOrderCreated');

      const codeBlock = page.locator('pre code').last();

      // Verify KafkaJS producer patterns
      await expect(codeBlock).toContainText('producer');
      await expect(codeBlock).toContainText('await producer.send');
      await expect(codeBlock).toContainText('orders.created');
    });

    test('Python shows kafka-python code for SUBSCRIBE', async ({ page }) => {
      await page.goto('operations/subscribeOrderCreated');

      // Click Python tab
      await page.getByText('Python', { exact: true }).click();

      const codeBlock = page.locator('pre code').last();

      // Verify kafka-python patterns
      await expect(codeBlock).toContainText('from kafka import KafkaConsumer');
      await expect(codeBlock).toContainText('KafkaConsumer');
      await expect(codeBlock).toContainText("'orders.created'");
    });

    test('Python shows kafka-python producer code for PUBLISH', async ({ page }) => {
      await page.goto('operations/publishOrderCreated');

      // Click Python tab
      await page.getByText('Python', { exact: true }).click();

      const codeBlock = page.locator('pre code').last();

      // Verify kafka-python producer patterns
      await expect(codeBlock).toContainText('from kafka import KafkaProducer');
      await expect(codeBlock).toContainText('KafkaProducer');
      await expect(codeBlock).toContainText('producer.send');
    });

    test('helper text adapts to AsyncAPI operations', async ({ page }) => {
      await page.goto('operations/subscribeOrderCreated');

      // Verify AsyncAPI-specific helper text
      await expect(page.getByText(/subscribe to the/i)).toBeVisible();
      await expect(page.locator('strong').filter({ hasText: 'orders.created' })).toBeVisible();
      await expect(page.getByText(/channel\./)).toBeVisible();
    });
  });

  test.describe('Copy Functionality', () => {
    test('copy button exists for code examples', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Find copy button in code examples section
      const codeExamplesSection = page.locator('text=💻 Code Examples').locator('..').locator('..');
      const copyButton = codeExamplesSection.locator('button').filter({ has: page.locator('svg') }).first();

      await expect(copyButton).toBeVisible();
    });

    test('copy button exists for example response', async ({ page }) => {
      await page.goto('operations/listProducts');

      // Find copy button in example response section
      const exampleSection = page.locator('text=Example Response').locator('..').locator('..');
      const copyButton = exampleSection.locator('button').filter({ has: page.locator('svg') }).first();

      await expect(copyButton).toBeVisible();
    });

    test('copy button exists for example request in POST', async ({ page }) => {
      await page.goto('operations/createOrder');

      // Find copy button in example request section
      const exampleSection = page.locator('text=Example Request').locator('..').locator('..');
      const copyButton = exampleSection.locator('button').filter({ has: page.locator('svg') }).first();

      await expect(copyButton).toBeVisible();
    });

    test('multiple copy buttons work independently', async ({ page }) => {
      await page.goto('operations/createOrder');

      // Should have 3 copy buttons: Example Request + Example Response + Code Examples
      // Look specifically for copy buttons within card sections
      const copyButtons = page.locator('[class*="card"]').locator('button').filter({ has: page.locator('svg') });
      await expect(copyButtons).toHaveCount(3);
    });
  });

  test.describe('Dynamic Code Generation', () => {
    test('function names use operation ID in snake_case', async ({ page }) => {
      await page.goto('operations/getUserOrders');

      const codeBlock = page.locator('pre code').last();

      // Verify function name conversion (getUserOrders -> get_user_orders)
      await expect(codeBlock).toContainText('get_user_orders');
    });

    test('code uses actual API base URL from spec', async ({ page }) => {
      await page.goto('operations/listProducts');

      const codeBlock = page.locator('pre code').last();

      // Verify base URL from OpenAPI spec
      await expect(codeBlock).toContainText('https://api.example.com/v1');
    });

    test('code includes proper error handling', async ({ page }) => {
      await page.goto('operations/listProducts');

      const codeBlock = page.locator('pre code').last();

      // Verify error handling in JavaScript
      await expect(codeBlock).toContainText('if (!response.ok)');
      await expect(codeBlock).toContainText('throw new Error');
    });
  });
});
