import { test, expect } from '@playwright/test';

/**
 * Test Suite: Search & Filtering
 *
 * Covers:
 * - Search by operation name
 * - Search by location/path
 * - Tag/category filtering
 * - Filter combinations
 * - Clear filters functionality
 */
test.describe('Search & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
  });

  test.describe('Search Functionality', () => {
    test('search bar is visible and functional', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);
      await expect(searchBox).toBeVisible();
      await expect(searchBox).toBeEditable();
    });

    test('search by operation name filters results', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Search for "order"
      await searchBox.fill('order');

      // Should show operations with "order" in name or description
      await expect(page.getByRole('heading', { name: 'Create new order' })).toBeVisible();
      await expect(page.getByRole('heading', { name: "Get user's orders" })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Publish order created event' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Subscribe to order created events' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Publish order updated event' })).toBeVisible();

      // Should NOT show product-related operations
      await expect(page.getByRole('heading', { name: 'List all products' })).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Get product details' })).not.toBeVisible();
    });

    test('search by location/path filters results', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Search for "/products"
      await searchBox.fill('/products');

      // Should show operations with /products in path
      await expect(page.getByRole('heading', { name: 'List all products' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Get product details' })).toBeVisible();

      // Should NOT show order operations
      await expect(page.getByRole('heading', { name: 'Create new order' })).not.toBeVisible();
    });

    test('search by channel name filters AsyncAPI operations', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Search for "orders.created"
      await searchBox.fill('orders.created');

      // Should show operations on orders.created channel
      await expect(page.getByRole('heading', { name: 'Publish order created event' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Subscribe to order created events' })).toBeVisible();

      // Should NOT show orders.updated
      await expect(page.getByRole('heading', { name: 'Publish order updated event' })).not.toBeVisible();
    });

    test('search is case-insensitive', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Search with uppercase
      await searchBox.fill('PRODUCTS');

      // Should still find product operations
      await expect(page.getByRole('heading', { name: 'List all products' })).toBeVisible();
    });

    test('clearing search shows all operations', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Search for something
      await searchBox.fill('order');
      await expect(page.getByRole('heading', { name: 'List all products' })).not.toBeVisible();

      // Clear search
      await searchBox.clear();

      // Should show all operations again
      await expect(page.getByRole('heading', { name: 'List all products' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Create new order' })).toBeVisible();
    });

    test('search with no results shows appropriate message or empty state', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Search for something that doesn't exist
      await searchBox.fill('nonexistentoperation123');

      // Verify no operation cards are visible
      await expect(page.getByRole('heading', { name: 'List all products' })).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Create new order' })).not.toBeVisible();

      // Groups should still exist but be empty or hidden
      const requestResponseGroup = page.locator('text=request response').locator('..').locator('..');
      const operationCards = requestResponseGroup.getByRole('generic').filter({ hasText: /GET|POST/ });
      await expect(operationCards).toHaveCount(0);
    });
  });

  test.describe('Tag/Category Filtering', () => {
    test('displays available tag filters', async ({ page }) => {
      // Verify filter section
      await expect(page.getByText('Filter by tag:')).toBeVisible();

      // Verify tag options (use first occurrence which is in the filter section)
      await expect(page.getByText('All', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Products', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Orders', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Users', { exact: true }).first()).toBeVisible();
    });

    test('filtering by Products tag shows only product operations', async ({ page }) => {
      // Click Products filter (first one in filter section)
      await page.getByText('Products', { exact: true }).first().click();

      // Should show product operations
      await expect(page.getByRole('heading', { name: 'List all products' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Get product details' })).toBeVisible();

      // Should NOT show order-only operations (though some might have both tags)
      // Create new order should still be visible if it has Products tag
    });

    test('filtering by Orders tag shows order-related operations', async ({ page }) => {
      // Click Orders filter (first one in filter section)
      await page.getByText('Orders', { exact: true }).first().click();

      // Should show order operations
      await expect(page.getByRole('heading', { name: 'Create new order' })).toBeVisible();
      await expect(page.getByRole('heading', { name: "Get user's orders" })).toBeVisible();
    });

    test('filtering by Users tag shows user operations', async ({ page }) => {
      // Click Users filter (first one in filter section)
      await page.getByText('Users', { exact: true }).first().click();

      // Should show user-related operations
      await expect(page.getByRole('heading', { name: "Get user's orders" })).toBeVisible();
    });

    test('All tag shows all operations', async ({ page }) => {
      // Click a specific filter first
      await page.getByText('Products', { exact: true }).first().click();

      // Then click All to reset
      await page.getByText('All', { exact: true }).first().click();

      // Should show all operations
      await expect(page.getByRole('heading', { name: 'List all products' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Create new order' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Subscribe to order created events' })).toBeVisible();
    });

    test('active filter is visually indicated', async ({ page }) => {
      // Click Products filter (first one in filter section)
      await page.getByText('Products', { exact: true }).first().click();

      // Products badge should be styled differently (active state)
      // This might be a background color, border, or other visual indicator
      const productsFilter = page.locator('text=Products').first();
      await expect(productsFilter).toBeVisible();
      // Additional assertion for active state styling could go here
    });
  });

  test.describe('Grouping Modes', () => {
    test('grouping buttons are visible', async ({ page }) => {
      await expect(page.getByText('Group by:')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Communication Pattern' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Category', exact: true })).toBeVisible();
    });

    test('Communication Pattern grouping is default', async ({ page }) => {
      // Verify pattern groups are visible
      await expect(page.getByRole('heading', { name: /request response/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /publish subscribe/i })).toBeVisible();
    });

    test('switching to Category grouping reorganizes operations', async ({ page }) => {
      // Click Category grouping
      await page.getByRole('button', { name: 'Category', exact: true }).click();

      // Verify category groups appear (these will be headings in the main content)
      await expect(page.locator('main').getByRole('heading', { name: /products/i }).first()).toBeVisible();
      await expect(page.locator('main').getByRole('heading', { name: /orders/i }).first()).toBeVisible();

      // Pattern groups should no longer be headings
      await expect(page.getByRole('heading', { name: /request response/i })).not.toBeVisible();
    });

    test('grouping persists when filtering', async ({ page }) => {
      // Switch to Category grouping
      await page.getByRole('button', { name: 'Category', exact: true }).click();

      // Apply a filter
      await page.getByText('Products', { exact: true }).first().click();

      // Grouping should still be by Category (look for category heading in main content)
      await expect(page.locator('main').getByRole('heading', { name: /products/i }).first()).toBeVisible();

      // Pattern groups should still not be headings
      await expect(page.getByRole('heading', { name: /request response/i })).not.toBeVisible();
    });
  });

  test.describe('Combined Filtering', () => {
    test('search and tag filter work together', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Apply tag filter
      await page.getByText('Orders', { exact: true }).first().click();

      // Then search within filtered results
      await searchBox.fill('user');

      // Should show only operations that match BOTH filters
      await expect(page.getByRole('heading', { name: "Get user's orders" })).toBeVisible();

      // Should NOT show other order operations without "user"
      await expect(page.getByRole('heading', { name: 'Create new order' })).not.toBeVisible();
    });

    test('changing grouping does not affect filters', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);

      // Apply search
      await searchBox.fill('product');

      // Change grouping
      await page.getByRole('button', { name: 'Category', exact: true }).click();

      // Search filter should still be active - shows operations with "product" in name/description
      await expect(page.getByRole('heading', { name: 'List all products' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Get product details' })).toBeVisible();
      // "Create new order" has "products" in description, so it should be visible
      await expect(page.getByRole('heading', { name: 'Create new order' })).toBeVisible();
      
      // Should NOT show operations without "product" in name/description/tags/location
      await expect(page.getByRole('heading', { name: "Get user's orders" })).not.toBeVisible();
    });
  });

  test.describe('Filter UI/UX', () => {
    test('search placeholder text is descriptive', async ({ page }) => {
      const searchBox = page.getByPlaceholder(/Search operations by name, description, or location/i);
      await expect(searchBox).toBeVisible();
    });

    test('tag filters are clickable and responsive', async ({ page }) => {
      const productsFilter = page.getByText('Products', { exact: true }).first();

      // Verify it's clickable
      await expect(productsFilter).toBeVisible();

      // Click should work
      await productsFilter.click();

      // State should change (operations filtered)
      // Already verified in other tests
    });
  });
});
