import fs from 'fs-extra';
import path from 'path';
import { 
  getTemplatesPath, 
  createContentHash, 
  contentContains, 
  readTemplate,
  getFilesInDirectory 
} from './utils.js';

/**
 * Handle CLAUDE.md file creation or updating
 */
export async function handleClaudeMarkdown(targetDir) {
  const claudeFile = path.join(targetDir, 'CLAUDE.md');
  const templateContent = await readTemplate('CLAUDE.md');
  const templateHash = createContentHash(templateContent);
  
  if (!(await fs.pathExists(claudeFile))) {
    // File doesn't exist, create it
    await fs.writeFile(claudeFile, templateContent);
    return { action: 'created', details: 'Created new CLAUDE.md' };
  }
  
  // File exists, check if it contains our template content
  const existingContent = await fs.readFile(claudeFile, 'utf8');
  const existingHash = createContentHash(existingContent);
  
  // Check if template content is already present
  if (existingHash === templateHash || contentContains(existingContent, templateContent.trim())) {
    return { action: 'skipped', details: 'CLAUDE.md already contains template content' };
  }
  
  // Look for existing "# CLAUDE.md" heading
  const claudeHeadingRegex = /^# CLAUDE\.md\s*$/m;
  const headingMatch = existingContent.match(claudeHeadingRegex);
  
  let updatedContent;
  if (headingMatch) {
    // Found existing heading, add template content right below it
    const headingIndex = headingMatch.index + headingMatch[0].length;
    const beforeHeading = existingContent.substring(0, headingIndex);
    const afterHeading = existingContent.substring(headingIndex);
    updatedContent = beforeHeading + '\n\n' + templateContent + afterHeading;
  } else {
    // No heading found, add one at the beginning with template content
    const heading = '# CLAUDE.md\n\n';
    updatedContent = heading + templateContent + '\n\n' + existingContent;
  }
  
  await fs.writeFile(claudeFile, updatedContent);
  
  return { action: 'updated', details: 'Appended template content to existing CLAUDE.md' };
}

/**
 * Handle directory mirroring (create if not exists, skip if exists)
 */
export async function handleDirectoryMirror(targetDir, relativePath) {
  const targetPath = path.join(targetDir, relativePath);
  const templatePath = path.join(getTemplatesPath(), relativePath);
  
  if (await fs.pathExists(targetPath)) {
    return { action: 'skipped', details: `Directory ${relativePath} already exists` };
  }
  
  // Copy entire directory
  await fs.copy(templatePath, targetPath);
  return { action: 'created', details: `Created ${relativePath} directory` };
}

/**
 * Handle selective file copying (add missing files only, optionally overwrite existing)
 * @param {string} targetDir - The target directory
 * @param {string} relativePath - The relative path to copy
 * @param {Object} options - Options for the copy operation
 * @param {boolean} options.overwriteExisting - Whether to overwrite existing files (default: false)
 * @param {function} options.filter - Function to filter which files to overwrite (default: all files)
 */
export async function handleSelectiveFileCopy(targetDir, relativePath, options = {}) {
  const { overwriteExisting = false, filter = () => true } = options;
  const targetPath = path.join(targetDir, relativePath);
  const templatePath = path.join(getTemplatesPath(), relativePath);

  if (!(await fs.pathExists(targetPath))) {
    // Directory doesn't exist, create it with all template files
    await fs.copy(templatePath, targetPath);
    const files = await getFilesInDirectory(templatePath);
    return {
      action: 'created',
      details: `Created ${relativePath} with ${files.length} files`,
      filesAdded: files.length
    };
  }

  // Directory exists, check for missing files and optionally overwrite existing
  const templateFiles = await getFilesInDirectory(templatePath);
  const targetFiles = await getFilesInDirectory(targetPath);
  const missingFiles = templateFiles.filter(file => !targetFiles.includes(file));

  let filesAdded = 0;
  let filesOverwritten = 0;

  // Copy missing files
  for (const missingFile of missingFiles) {
    const sourcePath = path.join(templatePath, missingFile);
    const destPath = path.join(targetPath, missingFile);

    // Ensure destination directory exists
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(sourcePath, destPath);
    filesAdded++;
  }

  // Optionally overwrite existing files that match filter
  if (overwriteExisting) {
    const existingFiles = templateFiles.filter(file => targetFiles.includes(file) && filter(file));

    for (const existingFile of existingFiles) {
      const sourcePath = path.join(templatePath, existingFile);
      const destPath = path.join(targetPath, existingFile);

      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(sourcePath, destPath);
      filesOverwritten++;
    }
  }

  if (filesAdded === 0 && filesOverwritten === 0) {
    return {
      action: 'skipped',
      details: `All files in ${relativePath} are up to date`,
      filesAdded: 0
    };
  }

  const result = {
    action: 'updated',
    filesAdded
  };

  if (overwriteExisting && filesOverwritten > 0) {
    result.filesOverwritten = filesOverwritten;
    result.details = `Added ${filesAdded} missing files, overwritten ${filesOverwritten} files in ${relativePath}`;
  } else {
    result.details = `Added ${filesAdded} missing files to ${relativePath}`;
  }

  return result;
}

/**
 * Handle single file copying (create if not exists, skip if exists)
 */
export async function handleSingleFile(targetDir, relativePath) {
  const targetPath = path.join(targetDir, relativePath);
  const templatePath = path.join(getTemplatesPath(), relativePath);
  
  if (await fs.pathExists(targetPath)) {
    return { action: 'skipped', details: `File ${relativePath} already exists` };
  }
  
  // Ensure target directory exists
  await fs.ensureDir(path.dirname(targetPath));
  await fs.copy(templatePath, targetPath);
  
  return { action: 'created', details: `Created ${relativePath}` };
}