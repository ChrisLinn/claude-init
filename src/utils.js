import { createHash } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the absolute path to the templates directory
 */
export function getTemplatesPath() {
  // return path.join(__dirname, '..', 'templates');
  return path.join(__dirname, '..');
}

/**
 * Create a hash of file content for comparison
 */
export function createContentHash(content) {
  return createHash('md5').update(content.trim()).digest('hex');
}

/**
 * Check if content contains a specific text (case-insensitive)
 */
export function contentContains(content, searchText) {
  return content.toLowerCase().includes(searchText.toLowerCase());
}

/**
 * Read a template file
 */
export async function readTemplate(relativePath) {
  const templatePath = path.join(getTemplatesPath(), relativePath);
  return await fs.readFile(templatePath, 'utf8');
}

/**
 * Get all files in a directory recursively
 */
export async function getFilesInDirectory(dirPath) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stats = await fs.stat(fullPath);
      
      if (stats.isFile()) {
        files.push(entry);
      } else if (stats.isDirectory()) {
        const subFiles = await getFilesInDirectory(fullPath);
        files.push(...subFiles.map(f => path.join(entry, f)));
      }
    }
  } catch (error) {
    // Directory doesn't exist
    return [];
  }
  
  return files;
}