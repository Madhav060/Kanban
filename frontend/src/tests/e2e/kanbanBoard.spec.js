// tests/e2e/fileUploadTesting.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to fully load
    await page.waitForSelector('h1:has-text("Task Manager Board")');
    
    // Create a test task to attach files to
    await page.fill('input[placeholder="Enter task title"]', 'File Upload Test Task');
    await page.fill('input[placeholder="Enter email address"]', 'test@example.com');
    await page.click('button:has-text("Add Task")');
    
    // Wait for task to appear
    await page.waitForSelector('.task-card:has-text("File Upload Test Task")');
  });

  test('user can upload a file to a task', async ({ page }) => {
    // Click on the task to open details (assuming this reveals file upload)
    await page.click('.task-card:has-text("File Upload Test Task")');
    
    // Wait for file upload input to be visible
    await page.waitForSelector('input[type="file"]');
    
    // Create a test file path
    const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
    
    // Upload file
    await page.setInputFiles('input[type="file"]', testFilePath);
    
    // Click upload button (if separate button exists)
    await page.click('button:has-text("Attach File")');
    
    // Verify success message
    await expect(page.locator('.notification-success')).toContainText('File uploaded successfully');
    
    // Verify file appears in attachments list
    await expect(page.locator('.task-attachments')).toContainText('test-file.txt');
  });

  test('uploaded files display correctly with preview', async ({ page }) => {
    // Open task details
    await page.click('.task-card:has-text("File Upload Test Task")');
    await page.waitForSelector('input[type="file"]');
    
    // Upload an image file
    const imagePath = path.join(__dirname, '../fixtures/test-image.png');
    await page.setInputFiles('input[type="file"]', imagePath);
    await page.click('button:has-text("Attach File")');
    
    // Verify the image thumbnail is displayed
    const imgPreview = page.locator('.file-preview img');
    await expect(imgPreview).toBeVisible();
    
    // Verify the file name is displayed
    await expect(page.locator('.file-name')).toContainText('test-image.png');
    
    // Verify file size is displayed
    await expect(page.locator('.file-size')).toContainText('KB');
  });

  test('invalid files show an error message', async ({ page }) => {
    // Open task details
    await page.click('.task-card:has-text("File Upload Test Task")');
    await page.waitForSelector('input[type="file"]');
    
    // Create an invalid file (executable in this case)
    const invalidFilePath = path.join(__dirname, '../fixtures/invalid.exe');
    
    // Upload the invalid file
    await page.setInputFiles('input[type="file"]', invalidFilePath);
    await page.click('button:has-text("Attach File")');
    
    // Verify error message appears
    await expect(page.locator('.error-message')).toContainText('Invalid file type');
    
    // Verify the file was not added to attachments
    await expect(page.locator('.task-attachments')).not.toContainText('invalid.exe');
  });

  test('user can download an uploaded file', async ({ page }) => {
    // First upload a test file
    await page.click('.task-card:has-text("File Upload Test Task")');
    await page.waitForSelector('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
    await page.setInputFiles('input[type="file"]', testFilePath);
    await page.click('button:has-text("Attach File")');
    
    // Wait for download button to appear
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    // Verify the downloaded file name
    expect(download.suggestedFilename()).toBe('test-file.txt');
  });

  test('user can delete an uploaded file', async ({ page }) => {
    // Upload a test file first
    await page.click('.task-card:has-text("File Upload Test Task")');
    await page.waitForSelector('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
    await page.setInputFiles('input[type="file"]', testFilePath);
    await page.click('button:has-text("Attach File")');
    
    // Count attachments before deletion
    const attachmentsBefore = await page.locator('.file-item').count();
    
    // Click delete button on the file
    await page.click('.file-item:has-text("test-file.txt") .delete-file');
    
    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Verify file is removed
    await expect(page.locator('.file-item:has-text("test-file.txt")')).toHaveCount(0);
    
    // Verify attachments count decreased
    const attachmentsAfter = await page.locator('.file-item').count();
    expect(attachmentsAfter).toBe(attachmentsBefore - 1);
  });
});